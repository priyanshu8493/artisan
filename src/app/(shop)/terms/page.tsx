import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Artisan Market as a buyer or seller.",
};

export default function TermsPage() {
  return (
    <article className="container-page max-w-3xl py-14">
      <h1 className="text-display-lg font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">Last updated: August 2026</p>

      <div className="rich-text mt-8 text-[15px]">
        <h2>1. The marketplace</h2>
        <p>
          Artisan Market connects independent sellers (&ldquo;makers&rdquo;) with customers. Contracts of sale
          form between you and the maker; we provide the platform, payments infrastructure and dispute assistance.
        </p>

        <h2>2. Accounts</h2>
        <p>
          You must provide accurate information and keep credentials secure. You&apos;re responsible for activity
          on your account. Sellers must accurately represent their goods, including materials, dimensions and origin.
        </p>

        <h2>3. Orders, pricing &amp; taxes</h2>
        <p>
          Prices are shown in USD (US) or GBP (UK). UK orders include VAT at 20%; US orders add applicable
          state sales tax at checkout. Makers ship within their stated handling time.
        </p>

        <h2>4. Returns</h2>
        <p>
          Buyers may cancel within 14 days of receipt and return items within 30 days in original condition
          (UK statutory rights apply). Bespoke commissions are final sale unless faulty.
        </p>

        <h2>5. Acceptable use</h2>
        <p>
          No scraping, reverse engineering, fraudulent reviews or resale of platform content without permission.
          We may suspend accounts that violate these terms or applicable law.
        </p>

        <h2>6. Liability</h2>
        <p>
          To the extent permitted by law, our aggregate liability is limited to fees earned on the relevant
          order(s). Nothing limits liability for death, personal injury or fraud.
        </p>
      </div>
    </article>
  );
}
