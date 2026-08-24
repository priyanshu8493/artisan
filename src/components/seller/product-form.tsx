"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";
import {
  Bold, Italic, List, ListOrdered, Heading2, Undo2, Redo2,
  Trash2, GripVertical, Plus, X, ImageIcon, Loader2,
  ChevronLeft, ChevronRight, Check, Eye,
} from "lucide-react";
import { Input, Textarea, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PRODUCT_STATUSES } from "@/lib/constants";
import { slugify, cn } from "@/lib/utils";

/* ------------------------------------------------------------------ types */

export interface FormImage {
  url: string;
  alt?: string;
}
export interface FormVariant {
  name: string;
  optionSize?: string;
  optionColor?: string;
  optionMaterial?: string;
  priceDeltaCents: number;
  stock: number;
  sku?: string;
}
export interface ProductFormValues {
  title: string;
  slug: string;
  descriptionHtml: string;
  storyHtml: string;
  categoryId: string;
  sku: string;
  priceDollars: string;
  compareAtDollars: string;
  materials: string;
  color: string;
  dimensions: string;
  weightGrams: string;
  careInstructions: string;
  originCountry: "" | "US" | "GB";
  stock: number;
  lowStockThreshold: number;
  status: string;
  featured: boolean;
  videoUrl: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  images: FormImage[];
  variants: FormVariant[];
}

const STEPS = ["Basics", "Media", "Inventory", "Details", "Publish"] as const;

const EMPTY: ProductFormValues = {
  title: "",
  slug: "",
  descriptionHtml: "",
  storyHtml: "",
  categoryId: "",
  sku: "",
  priceDollars: "",
  compareAtDollars: "",
  materials: "",
  color: "",
  dimensions: "",
  weightGrams: "",
  careInstructions: "",
  originCountry: "",
  stock: 1,
  lowStockThreshold: 3,
  status: "DRAFT",
  featured: false,
  videoUrl: "",
  metaTitle: "",
  metaDescription: "",
  keywords: "",
  images: [],
  variants: [],
};

function htmlToText(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/* ------------------------------------------------------------- rich editor */

function RichText({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-text min-h-[140px] px-3 py-2 focus:outline-none text-sm",
        "data-placeholder": placeholder ?? "",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value && editor.isEmpty && !editor.isFocused) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return <div className="skeleton h-[180px] rounded-md" />;

  const Btn = ({
    icon: Icon,
    action,
    active,
    label,
  }: {
    icon: any;
    action: () => void;
    active?: boolean;
    label: string;
  }) => (
    <button
      type="button"
      onClick={action}
      aria-label={label}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded transition",
        active ? "bg-terracotta text-white" : "text-[rgb(var(--fg-muted,#666))] hover:bg-sand dark:hover:bg-charcoal-soft"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <div className="overflow-hidden rounded-md border border-[rgb(var(--line))]">
      <div className="flex flex-wrap gap-0.5 border-b border-[rgb(var(--line)/0.6)] bg-sand/50 px-2 py-1.5 dark:bg-charcoal-soft/40">
        <Btn icon={Undo2} label="Undo" action={() => editor.chain().focus().undo().run()} />
        <Btn icon={Redo2} label="Redo" action={() => editor.chain().focus().redo().run()} />
        <span className="mx-1 w-px bg-[rgb(var(--line))]" />
        <Btn icon={Heading2} label="Heading" action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} />
        <Btn icon={Bold} label="Bold" action={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} />
        <Btn icon={Italic} label="Italic" action={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} />
        <span className="mx-1 w-px bg-[rgb(var(--line))]" />
        <Btn icon={List} label="Bullet list" action={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} />
        <Btn icon={ListOrdered} label="Numbered list" action={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

/* -------------------------------------------------------------- main form */

export function ProductForm({
  mode,
  productId,
  initial,
  categories,
}: {
  mode: "create" | "edit";
  productId?: string;
  initial?: Partial<ProductFormValues>;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<ProductFormValues>({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const draftKey = `product-draft-${productId ?? "new"}`;
  const restoredRef = useRef(false);

  /* -------- autosave draft (localStorage) */
  useEffect(() => {
    if (!restoredRef.current) {
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved && mode === "create") {
          const parsed = JSON.parse(saved);
          setValues((v) => ({ ...v, ...parsed }));
          toast.info("Draft restored", { description: "Your unsaved changes were recovered." });
        }
      } catch {}
      restoredRef.current = true;
      return;
    }
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(values));
      } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [values, draftKey, mode]);

  const set = useCallback(<K extends keyof ProductFormValues>(key: K, val: ProductFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: val }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }, []);

  const autoSlug = useMemo(
    () => (mode === "create" ? slugify(values.title).slice(0, 80) : values.slug),
    [values.title, values.slug, mode]
  );

  /* ------------------------------------------------------------ validation */
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (values.title.trim().length < 3) errs.title = "Title must be at least 3 characters.";
    if (!values.categoryId) errs.categoryId = "Choose a category.";
    const price = parseFloat(values.priceDollars);
    if (!Number.isFinite(price) || price < 1) errs.priceDollars = "Enter a price of at least $1.";
    if (values.compareAtDollars) {
      const cmp = parseFloat(values.compareAtDollars);
      if (!Number.isFinite(cmp) || cmp <= price) errs.compareAtDollars = "Compare-at price should be higher than the sale price.";
    }
    if (htmlToText(values.descriptionHtml).length < 20) errs.descriptionHtml = "Write at least 20 characters describing your piece.";
    if (values.images.length === 0) errs.images = "Add at least one image.";
    if (values.variants.some((v) => !v.name.trim())) errs.variants = "Every variant needs a name.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* ---------------------------------------------------------------- submit */
  async function submit(statusOverride?: string) {
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      // jump to first step containing an error
      const stepOf: Record<string, number> = { title: 0, categoryId: 0, priceDollars: 0, compareAtDollars: 0, descriptionHtml: 0, images: 1, variants: 2 };
      const firstErr = Object.keys(errors)[0];
      if (firstErr && firstErr in stepOf) setStep(stepOf[firstErr]);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: values.title.trim(),
        slug: values.slug || autoSlug,
        description: values.descriptionHtml,
        story: values.storyHtml || null,
        sku: values.sku || null,
        priceCents: Math.round(parseFloat(values.priceDollars) * 100),
        compareAtCents: values.compareAtDollars ? Math.round(parseFloat(values.compareAtDollars) * 100) : null,
        categoryId: values.categoryId,
        materials: values.materials || null,
        color: values.color || null,
        dimensions: values.dimensions || null,
        weightGrams: values.weightGrams ? parseInt(values.weightGrams, 10) : null,
        careInstructions: values.careInstructions || null,
        originCountry: values.originCountry || null,
        stock: values.stock,
        lowStockThreshold: values.lowStockThreshold,
        status: statusOverride ?? values.status,
        featured: values.featured,
        videoUrl: values.videoUrl || null,
        metaTitle: values.metaTitle || null,
        metaDescription: values.metaDescription || null,
        keywords: values.keywords || null,
        images: values.images.map((i) => ({ url: i.url, alt: i.alt ?? null })),
        variants: values.variants.map((v) => ({ ...v, name: v.name.trim() })),
      };

      const res = await fetch(mode === "create" ? "/api/seller/products" : `/api/seller/products/${productId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Save failed");

      localStorage.removeItem(draftKey);
      toast.success(mode === "create" ? "Product created" : "Changes saved");
      router.push("/seller/products");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong saving the product.");
    } finally {
      setSaving(false);
    }
  }

  /* --------------------------------------------------------------- uploads */
  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (values.images.length + list.length > 10) {
      toast.error("Maximum 10 images per product.");
      return;
    }
    setUploading(true);
    for (const file of list) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/uploads", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Upload failed");
        setValues((v) => ({ ...v, images: [...v.images, { url: data.url }] }));
      } catch (err: any) {
        toast.error(err.message);
      }
    }
    setUploading(false);
  }

  function reorder(from: number, to: number) {
    setValues((v) => {
      const imgs = [...v.images];
      const [moved] = imgs.splice(from, 1);
      imgs.splice(to, 0, moved);
      return { ...v, images: imgs };
    });
  }

  /* ------------------------------------------------------------- variants */
  function addVariant() {
    setValues((v) => ({
      ...v,
      variants: [
        ...v.variants,
        { name: `Variant ${v.variants.length + 1}`, optionSize: "", optionColor: "", optionMaterial: "", priceDeltaCents: 0, stock: 0, sku: "" },
      ],
    }));
  }

  const canNext = true; // per-step soft gating happens on final validate

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{mode === "create" ? "Add a new piece" : "Edit product"}</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Drafts autosave locally as you type.</p>
        </div>
        {mode === "edit" && productId && (
          <a
            href={`/products/${autoSlug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-md card-surface px-4 text-sm font-semibold transition hover:border-terracotta/50 hover:text-terracotta"
          >
            <Eye className="h-4 w-4" /> Preview
          </a>
        )}
      </div>

      {/* Stepper */}
      <ol className="flex flex-wrap items-center gap-1 text-sm" aria-label="Form progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-1">
            <button
              onClick={() => setStep(i)}
              aria-current={step === i ? "step" : undefined}
              className={cn(
                "flex h-8 items-center gap-2 rounded-full px-3 font-medium transition",
                step === i
                  ? "bg-charcoal text-cream dark:bg-cream dark:text-charcoal"
                  : i < step
                    ? "text-terracotta hover:bg-terracotta/10"
                    : "text-[rgb(var(--muted))] hover:bg-sand dark:hover:bg-charcoal-soft"
              )}
            >
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border text-xs", step === i ? "border-transparent bg-terracotta text-white" : i < step ? "border-terracotta text-terracotta" : "border-current")}>
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {label}
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-[rgb(var(--muted))]" />}
          </li>
        ))}
      </ol>

      {/* ---------------- Step 1: Basics */}
      {step === 0 && (
        <section className="space-y-5 animate-fadeUp">
          <Field label="Title" error={errors.title} required>
            <Input value={values.title} onChange={(e) => set("title", e.target.value)} placeholder="Hand-thrown Speckled Stoneware Mug" maxLength={120} />
            {values.title && <p className="mt-1 text-xs text-[rgb(var(--muted))]">URL: /products/{autoSlug || "…"}</p>}
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" error={errors.categoryId} required>
              <Select value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">Choose…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="SKU" hint="Optional internal code">
              <Input value={values.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} placeholder="POT-0042" maxLength={40} />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Price (USD)" error={errors.priceDollars} required>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[rgb(var(--muted))]">$</span>
                <Input inputMode="decimal" value={values.priceDollars} onChange={(e) => set("priceDollars", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="48.00" className="pl-7" />
              </div>
            </Field>
            <Field label="Compare-at price" hint="Shows a strikethrough when higher than price">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[rgb(var(--muted))]">$</span>
                <Input inputMode="decimal" value={values.compareAtDollars} onChange={(e) => set("compareAtDollars", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="60.00" className="pl-7" />
              </div>
            </Field>
          </div>
          <Field label="Description" error={errors.descriptionHtml} required hint="Rich text — tell buyers what makes this piece special.">
            <RichText value={values.descriptionHtml} onChange={(html) => set("descriptionHtml", html)} placeholder="Describe the piece, how it was made, and what's included…" />
          </Field>
          <Field label="Maker's story" hint="Optional — shown in a separate tab on the product page">
            <RichText value={values.storyHtml} onChange={(html) => set("storyHtml", html)} placeholder="The inspiration, the process, the hands behind it…" />
          </Field>
        </section>
      )}

      {/* ---------------- Step 2: Media */}
      {step === 1 && (
        <section className="space-y-5 animate-fadeUp">
          <Field label="Photos" error={errors.images} hint={`${values.images.length}/10 · drag to reorder · first image is the cover`} required>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
              }}
              className="rounded-lg border-2 border-dashed border-[rgb(var(--line))] p-5 transition hover:border-terracotta/50"
            >
              {uploading ? (
                <p className="flex items-center justify-center gap-2 py-6 text-sm text-[rgb(var(--muted))]"><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</p>
              ) : values.images.length === 0 ? (
                <label className="flex cursor-pointer flex-col items-center gap-2 py-8 text-center">
                  <ImageIcon className="h-8 w-8 text-[rgb(var(--muted))]" />
                  <span className="text-sm font-medium">Drop photos here or click to browse</span>
                  <span className="text-xs text-[rgb(var(--muted))]">JPG, PNG, WebP or SVG up to 8MB</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" multiple hidden onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
                </label>
              ) : (
                <>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="list" aria-label="Product images">
                    {values.images.map((img, i) => (
                      <li
                        key={`${img.url}-${i}`}
                        draggable
                        onDragStart={() => setDragIdx(i)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (dragIdx !== null && dragIdx !== i) reorder(dragIdx, i);
                          setDragIdx(null);
                        }}
                        className={cn("group relative aspect-square overflow-hidden rounded-lg card-surface", dragIdx === i && "opacity-50")}
                      >
                        <Image src={img.url} alt="" fill sizes="160px" className="object-cover" />
                        {i === 0 && <span className="absolute left-1 top-1 rounded bg-charcoal/80 px-1.5 py-0.5 text-[10px] font-bold text-cream">COVER</span>}
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-charcoal/70 px-1.5 py-1 opacity-0 transition group-hover:opacity-100">
                          <GripVertical className="h-4 w-4 cursor-grab text-cream/80" />
                          <button
                            type="button"
                            aria-label={`Remove image ${i + 1}`}
                            onClick={() => set("images", values.images.filter((_, j) => j !== i))}
                            className="rounded p-0.5 text-error-light hover:bg-error/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                    {values.images.length < 10 && (
                      <li>
                        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[rgb(var(--line))] text-[rgb(var(--muted))] transition hover:border-terracotta hover:text-terracotta">
                          <Plus className="h-6 w-6" />
                          <span className="text-xs font-medium">Add photo</span>
                          <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" multiple hidden onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
                        </label>
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
          </Field>
          <Field label="Video URL" hint="Optional MP4/WebM demo or process video">
            <Input value={values.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://…/making-of.mp4" />
          </Field>
        </section>
      )}

      {/* ---------------- Step 3: Inventory */}
      {step === 2 && (
        <section className="space-y-5 animate-fadeUp">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Stock quantity" hint="For pieces without variants">
              <Input type="number" min={0} max={100000} value={values.stock} onChange={(e) => set("stock", Math.max(0, parseInt(e.target.value || "0", 10)))} />
            </Field>
            <Field label="Low-stock alert threshold">
              <Input type="number" min={0} max={999} value={values.lowStockThreshold} onChange={(e) => set("lowStockThreshold", Math.max(0, parseInt(e.target.value || "0", 10)))} />
            </Field>
          </div>

          <div className="rounded-lg card-surface p-4 shadow-subtle">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Variants</h3>
                <p className="text-xs text-[rgb(var(--muted))]">Sizes, glazes, finishes — each with its own price offset &amp; stock.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="h-4 w-4" /> Add variant
              </Button>
            </div>
            {errors.variants && <p className="mt-2 text-xs text-error">{errors.variants}</p>}
            {values.variants.length === 0 ? (
              <p className="py-6 text-center text-sm text-[rgb(var(--muted))]">No variants — buyers will purchase the base listing.</p>
            ) : (
              <ul className="mt-3 space-y-2" role="list">
                {values.variants.map((v, i) => (
                  <li key={i} className="grid grid-cols-2 gap-2 rounded-md bg-sand/60 p-3 sm:grid-cols-12 dark:bg-charcoal-soft/30">
                    <div className="col-span-2 sm:col-span-3">
                      <Label>Name *</Label>
                      <Input value={v.name} onChange={(e) => updateVariant(i, { name: e.target.value })} placeholder="Small / Cobalt glaze" className="h-9 text-sm" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Size</Label>
                      <Input value={v.optionSize ?? ""} onChange={(e) => updateVariant(i, { optionSize: e.target.value })} placeholder="12oz" className="h-9 text-sm" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Colour</Label>
                      <Input value={v.optionColor ?? ""} onChange={(e) => updateVariant(i, { optionColor: e.target.value })} placeholder="Cobalt" className="h-9 text-sm" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>+/- $</Label>
                      <Input
                        inputMode="decimal"
                        value={(v.priceDeltaCents / 100).toFixed(2)}
                        onChange={(e) => {
                          const n = parseFloat(e.target.value.replace(/[^0-9.-]/g, ""));
                          updateVariant(i, { priceDeltaCents: Number.isFinite(n) ? Math.round(n * 100) : 0 });
                        }}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Stock</Label>
                      <Input type="number" min={0} value={v.stock} onChange={(e) => updateVariant(i, { stock: Math.max(0, parseInt(e.target.value || "0", 10)) })} className="h-9 text-sm" />
                    </div>
                    <div className="col-span-1 flex items-end sm:col-span-1">
                      <button
                        type="button"
                        aria-label={`Remove ${v.name}`}
                        onClick={() => set("variants", values.variants.filter((_, j) => j !== i))}
                        className="flex h-9 w-9 items-center justify-center rounded-md text-error transition hover:bg-error/10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* ---------------- Step 4: Details */}
      {step === 3 && (
        <section className="space-y-5 animate-fadeUp">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Materials" hint="Comma separated">
              <Input value={values.materials} onChange={(e) => set("materials", e.target.value)} placeholder="Stoneware clay, food-safe glaze" maxLength={200} />
            </Field>
            <Field label="Primary colour">
              <Input value={values.color} onChange={(e) => set("color", e.target.value)} placeholder="Terracotta" maxLength={40} />
            </Field>
            <Field label="Dimensions">
              <Input value={values.dimensions} onChange={(e) => set("dimensions", e.target.value)} placeholder='4" × 3.5" × 3"' maxLength={120} />
            </Field>
            <Field label="Weight (grams)">
              <Input type="number" min={0} value={values.weightGrams} onChange={(e) => set("weightGrams", e.target.value)} placeholder="450" />
            </Field>
            <Field label="Made in">
              <Select value={values.originCountry} onChange={(e) => set("originCountry", e.target.value as any)}>
                <option value="">Not specified</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
              </Select>
            </Field>
          </div>
          <Field label="Care instructions">
            <Textarea rows={3} value={values.careInstructions} onChange={(e) => set("careInstructions", e.target.value)} placeholder="Dishwasher safe. Avoid microwave use with metallic accents." maxLength={2000} />
          </Field>
        </section>
      )}

      {/* ---------------- Step 5: Publish */}
      {step === 4 && (
        <section className="space-y-5 animate-fadeUp">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Status">
              <Select value={values.status} onChange={(e) => set("status", e.target.value)}>
                {PRODUCT_STATUSES.map((s: string) => (
                  <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                ))}
              </Select>
            </Field>
            <label className="flex cursor-pointer items-start gap-3 self-end rounded-lg card-surface p-4 shadow-subtle">
              <input type="checkbox" checked={values.featured} onChange={(e) => set("featured", e.target.checked)} className="mt-0.5 h-4 w-4 accent-terracotta" />
              <span>
                <span className="block text-sm font-semibold">Request homepage feature</span>
                <span className="block text-xs text-[rgb(var(--muted))]">Featured spots are curated weekly by our team.</span>
              </span>
            </label>
          </div>
          <div className="rounded-lg card-surface space-y-4 p-4 shadow-subtle">
            <h3 className="text-sm font-semibold">Search engine preview</h3>
            <Field label="Meta title" hint={`${values.metaTitle.length}/70`}>
              <Input value={values.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} maxLength={70} placeholder={values.title || "Defaults to product title"} />
            </Field>
            <Field label="Meta description" hint={`${values.metaDescription.length}/160`}>
              <Textarea rows={2} value={values.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} maxLength={160} placeholder="Defaults to the start of your description." />
            </Field>
            <Field label="Keywords" hint="Comma separated">
              <Input value={values.keywords} onChange={(e) => set("keywords", e.target.value)} placeholder="handmade mug, stoneware, pottery" maxLength={300} />
            </Field>
          </div>
        </section>
      )}

      {/* Nav */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgb(var(--line)/0.6)] pt-5">
        <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          {errors && Object.keys(errors).length > 0 && (
            <p className="text-xs font-medium text-error">{Object.values(errors)[0]}</p>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => { if (canNext) setStep((s) => Math.min(STEPS.length - 1, s + 1)); }}>
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" disabled={saving} onClick={() => submit("DRAFT")}>
                Save as draft
              </Button>
              <Button type="button" disabled={saving} onClick={() => submit("ACTIVE")}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "create" ? "Publish product" : "Save & publish"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  function updateVariant(idx: number, patch: Partial<FormVariant>) {
    setValues((v) => ({
      ...v,
      variants: v.variants.map((vv, j) => (j === idx ? { ...vv, ...patch } : vv)),
    }));
  }
}

function Field({
  label,
  children,
  error,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label>
        {label}
        {required && <span className="ml-0.5 text-terracotta">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-[rgb(var(--muted))]">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-error">{error}</p>}
    </div>
  );
}
