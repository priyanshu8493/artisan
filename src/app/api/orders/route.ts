import { db } from "@/lib/db";
import { ok, handle, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validators";
import { generateOrderNumber } from "@/lib/utils";
import { taxRateFor, shippingMethodDef, convertFromUsd } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_CENTS_USD } from "@/lib/constants";
import { sendEmail, orderConfirmationEmail } from "@/lib/email";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readJson<unknown>(req);
    const input = checkoutSchema.parse(body);
    const user = await getSessionUser();
    const region = input.shippingAddress.country;

    // Load products & validate stock — prices always come from the DB, never the client
    const productIds = input.items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, status: "ACTIVE" },
      include: { variants: true, seller: { select: { userId: true } } },
    });
    if (products.length !== new Set(productIds).size)
      return ok({ error: "Some items are no longer available." }, { status: 409 });

    let subtotalUsd = 0;
    const lines = input.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const variant = item.variantId ? product.variants.find((v) => v.id === item.variantId) : null;
      if (!variant && item.variantId)
        throw Object.assign(new Error("Selected option is unavailable."), { status: 409 });
      const availableStock = variant ? variant.stock : product.stock;
      if (availableStock < item.quantity)
        throw Object.assign(
          new Error(`Only ${availableStock} of "${product.title}" left in stock.`),
          { status: 409 }
        );
      const unitPriceCents = product.priceCents + (variant?.priceDeltaCents ?? 0);
      subtotalUsd += unitPriceCents * item.quantity;
      return {
        productId: product.id,
        variantId: variant?.id ?? null,
        title: product.title,
        imageUrl: null as string | null, // resolved below
        variantName: variant?.name ?? null,
        unitPriceCents,
        quantity: item.quantity,
        product,
        variant,
      };
    });

    // Coupon
    let discountUsd = 0;
    let couponCode: string | null = null;
    if (input.couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: input.couponCode.trim().toUpperCase() },
      });
      if (coupon?.active && subtotalUsd >= coupon.minSubtotalCents &&
          (!coupon.expiresAt || coupon.expiresAt > new Date())) {
        if (coupon.percentOff) discountUsd = Math.round((subtotalUsd * coupon.percentOff) / 100);
        if (coupon.amountOffCents) discountUsd = Math.min(coupon.amountOffCents, subtotalUsd);
        couponCode = coupon.code;
      }
    }

    // Shipping & tax (USD base)
    const method = shippingMethodDef(region, input.shippingMethod);
    const shippingUsd =
      subtotalUsd - discountUsd >= FREE_SHIPPING_THRESHOLD_CENTS_USD ? 0 : method.priceCentsUsd;
    const taxable = Math.max(0, subtotalUsd - discountUsd);
    const taxRate = taxRateFor(region, input.shippingAddress.state);
    const taxUsd = Math.round(taxable * taxRate);
    const totalUsd = taxable + shippingUsd + taxUsd;

    const toRegion = (usd: number) => convertFromUsd(usd, region);

    const now = Date.now();
    const orderNumber = generateOrderNumber();

    const order = await db.order.create({
      data: {
        orderNumber,
        userId: user?.id ?? null,
        email: input.email.toLowerCase(),
        status: "PROCESSING",
        subtotalCents: toRegion(subtotalUsd),
        shippingCents: toRegion(shippingUsd),
        taxCents: toRegion(taxUsd),
        discountCents: toRegion(discountUsd),
        totalCents: toRegion(totalUsd),
        currency: region === "GB" ? "GBP" : "USD",
        region,
        couponCode,
        shipFullName: input.shippingAddress.fullName,
        shipLine1: input.shippingAddress.line1,
        shipLine2: input.shippingAddress.line2 ?? null,
        shipCity: input.shippingAddress.city,
        shipState: input.shippingAddress.state ?? null,
        shipPostalCode: input.shippingAddress.postalCode,
        shipCountry: region,
        shipPhone: input.shippingAddress.phone ?? null,
        shippingMethod: method.id,
        customerNote: input.customerNote ?? null,
        estimatedDeliveryMin: new Date(now + method.minDays * 864e5),
        estimatedDeliveryMax: new Date(now + method.maxDays * 864e5),
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            title: l.title,
            variantName: l.variantName,
            unitPriceCents: toRegion(l.unitPriceCents),
            quantity: l.quantity,
          })),
        },
        payments: {
          // Payment integration reserved: replace with Stripe PaymentIntent flow.
          create: [{ provider: "manual", amountCents: toRegion(totalUsd), status: "SUCCEEDED" }],
        },
        events: {
          create: [
            { status: "PENDING", message: "Order placed" },
            { status: "PROCESSING", message: "Artisans have been notified and are preparing your pieces" },
          ],
        },
      },
      include: { items: true },
    });

    // Stock decrement, logs, sales counters, seller notifications, purchase analytics
    for (const line of lines) {
      await Promise.all([
        line.variant
          ? db.productVariant.update({
              where: { id: line.variant.id },
              data: { stock: { decrement: line.quantity } },
            })
          : db.product.update({
              where: { id: line.productId },
              data: { stock: { decrement: line.quantity } },
            }),
        db.product.update({
          where: { id: line.productId },
          data: { salesCount: { increment: line.quantity } },
        }),
        db.stockLog.create({
          data: { productId: line.productId, delta: -line.quantity, reason: "SALE", note: orderNumber },
        }),
        db.analyticsEvent.create({
          data: { type: "PURCHASE", productId: line.productId, valueCents: line.unitPriceCents * line.quantity },
        }),
        db.notification.create({
          data: {
            userId: line.product.seller.userId,
            type: "ORDER",
            title: "New order received",
            body: `${line.quantity} × ${line.title} (${orderNumber})`,
            link: "/seller/orders",
          },
        }),
      ]);
    }

    await sendEmail({
      to: input.email,
      subject: `Order ${orderNumber} confirmed · Artisan Market`,
      html: orderConfirmationEmail({
        orderNumber,
        customerName: input.shippingAddress.fullName.split(" ")[0],
        totalCents: toRegion(totalUsd),
        region,
        itemCount: lines.reduce((n, l) => n + l.quantity, 0),
      }),
    });

    return ok({ orderNumber, orderId: order.id }, { status: 201 });
  });
}
