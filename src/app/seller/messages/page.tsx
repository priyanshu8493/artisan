"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Inbox, CheckCircle2, RotateCcw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

interface SellerMessage {
  id: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  body: string;
  resolved: boolean;
  createdAt: string;
  orderNumber: string | null;
  itemTitle: string | null;
}

export default function SellerMessagesPage() {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ messages: SellerMessage[] }>({
    queryKey: ["seller-messages"],
    queryFn: async () => (await fetch("/api/seller/messages")).json(),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, resolved }: { id: string; resolved: boolean }) => {
      const res = await fetch("/api/seller/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, resolved }),
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.resolved ? "Marked resolved" : "Reopened");
      qc.invalidateQueries({ queryKey: ["seller-messages"] });
    },
    onError: () => toast.error("Update failed."),
  });

  const messages = data?.messages ?? [];
  const open = messages.filter((m) => !m.resolved).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Messages</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Customer questions about your orders{open > 0 && <> · <strong className="text-terracotta">{open} open</strong></>}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-lg" />)}</div>
      ) : messages.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title="Inbox zero"
          description="When customers write to you about one of their orders, the message lands here."
        />
      ) : (
        <ul role="list" className="space-y-3">
          {messages.map((m) => {
            const expanded = openId === m.id;
            return (
              <li key={m.id} className={cn("rounded-lg card-surface shadow-subtle transition", m.resolved ? "opacity-70" : "")}>
                <button
                  onClick={() => setOpenId(expanded ? null : m.id)}
                  aria-expanded={expanded}
                  className="flex w-full items-start justify-between gap-3 p-4 text-left"
                >
                  <div className="min-w-0">
                    <p className={cn("truncate text-sm font-semibold", m.resolved && "line-through decoration-[rgb(var(--muted))]")}>
                      {!m.resolved && <Mail className="mr-1.5 inline h-4 w-4 text-terracotta" />}
                      {m.subject}
                    </p>
                    <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                      {m.fromName} · {new Date(m.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                      {m.orderNumber && <> · Order <strong>{m.orderNumber}</strong></>}
                    </p>
                  </div>
                  <span
                    role="status"
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                      m.resolved ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    )}
                  >
                    {m.resolved ? "Resolved" : "Open"}
                  </span>
                </button>
                {expanded && (
                  <div className="border-t border-[rgb(var(--line)/0.5)] p-4 pt-3 animate-fadeUp">
                    <p className="whitespace-pre-wrap rounded-md bg-sand/60 p-3 text-sm leading-relaxed dark:bg-charcoal-soft/40">{m.body}</p>
                    {m.itemTitle && <p className="mt-2 text-xs text-[rgb(var(--muted))]">Regarding: {m.itemTitle}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => window.location.href = `mailto:${m.fromEmail}?subject=Re: ${encodeURIComponent(m.subject)}`}>
                        Reply by email
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={toggle.isPending}
                        onClick={() => toggle.mutate({ id: m.id, resolved: !m.resolved })}
                      >
                        {m.resolved ? <><RotateCcw className="h-3.5 w-3.5" /> Reopen</> : <><CheckCircle2 className="h-3.5 w-3.5" /> Mark resolved</>}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
