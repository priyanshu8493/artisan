"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/feedback";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  _count: { products: number };
}

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
}

const emptyForm: CategoryForm = { name: "", slug: "", description: "", imageUrl: "", sortOrder: 0 };

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm);

  const { data, isLoading } = useQuery<{ categories: Category[] }>({
    queryKey: ["admin-categories"],
    queryFn: async () => (await fetch("/api/admin/categories")).json(),
  });

  const categories = data?.categories ?? [];

  function openEdit(c: Category) {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      imageUrl: c.imageUrl ?? "",
      sortOrder: c.sortOrder,
    });
    setShowForm(true);
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, sortOrder: categories.length });
    setShowForm(true);
  }

  const save = useMutation({
    mutationFn: async () => {
      if (form.name.trim().length < 2) throw new Error("Name must be at least 2 characters.");
      const res = await fetch(
        editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
        }
      );
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Save failed");
      return d;
    },
    onSuccess: () => {
      toast.success(editing ? "Category updated" : "Category created");
      setShowForm(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Delete failed");
    },
    onSuccess: () => {
      toast.success("Category deleted");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Categories</h1>
          <p className="text-sm text-[rgb(var(--muted))]">{categories.length} categories · organise the storefront</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add category</Button>
      </div>

      {/* Add/edit form */}
      {showForm && (
        <section className="rounded-lg card-surface p-5 shadow-subtle animate-fadeUp">
          <h2 className="font-display text-lg font-bold">{editing ? `Edit ${editing.name}` : "New category"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cat-name" required>Name</Label>
              <Input id="cat-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="cat-slug">Slug (slugified from name if blank)</Label>
              <Input id="cat-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.replace(/[^a-z0-9-]/g, "") })} placeholder="e.g. pottery-ceramics" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea id="cat-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={300} />
            </div>
            <div>
              <Label htmlFor="cat-img">Image URL</Label>
              <Input id="cat-img" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://… or /categories/….svg" />
            </div>
            <div>
              <Label htmlFor="cat-order">Sort order</Label>
              <Input id="cat-order" type="number" min={0} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value || "0", 10) })} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button disabled={save.isPending} onClick={() => save.mutate()}>
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? "Save changes" : "Create"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-28 rounded-lg" />)}</div>
      ) : categories.length === 0 ? (
        <EmptyState icon={<Tag className="h-6 w-6" />} title="No categories yet" description="Create your first category to organise the storefront." />
      ) : (
        <div className="overflow-hidden rounded-lg card-surface shadow-subtle">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--line)/0.6)] text-left text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Products</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-[rgb(var(--line)/0.4)] transition last:border-0 hover:bg-sand/50 dark:hover:bg-charcoal-soft/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {c.imageUrl ? (
                        <Image src={c.imageUrl} alt="" width={40} height={40} className="shrink-0 rounded-md object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-sand text-[rgb(var(--muted))] dark:bg-charcoal-soft"><Tag className="h-4 w-4" /></span>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium">{c.name}</p>
                        {c.description && <p className="max-w-[340px] truncate text-xs text-[rgb(var(--muted))]">{c.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{c.slug}</td>
                  <td className="px-4 py-3 tabular-nums">{c._count.products}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(c)} title="Edit" aria-label="Edit" className="flex h-8 w-8 items-center justify-center rounded-md text-[rgb(var(--muted))] transition hover:bg-sand hover:text-terracotta dark:hover:bg-charcoal-soft">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${c.name}"?`)) remove.mutate(c.id);
                        }}
                        title="Delete"
                        aria-label="Delete"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[rgb(var(--muted))] transition hover:bg-error/10 hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
