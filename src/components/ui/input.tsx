import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={error || undefined}
      className={cn(
        "flex h-10 w-full rounded-md card-surface px-3 py-2 text-sm shadow-innerSoft transition-colors placeholder:text-[rgb(var(--muted))] focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/25 disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-error focus:border-error focus:ring-error/20",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={error || undefined}
    className={cn(
      "flex min-h-[90px] w-full rounded-md card-surface px-3 py-2 text-sm shadow-innerSoft transition-colors placeholder:text-[rgb(var(--muted))] focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/25 disabled:cursor-not-allowed disabled:opacity-50",
      error && "border-error focus:border-error focus:ring-error/20",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }
>(({ className, error, children, ...props }, ref) => (
  <select
    ref={ref}
    aria-invalid={error || undefined}
    className={cn(
      "flex h-10 w-full appearance-none rounded-md card-surface px-3 py-2 text-sm shadow-innerSoft transition-colors focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/25 disabled:cursor-not-allowed disabled:opacity-50 bg-no-repeat",
      error && "border-error",
      className
    )}
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236E675D' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      backgroundPosition: "right 10px center",
      paddingRight: "34px",
    }}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

function Label({
  className,
  children,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium", className)}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-terracotta">*</span>}
    </label>
  );
}

interface FieldErrorProps { message?: string | null }

function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-error">
      {message}
    </p>
  );
}

export { Input, Textarea, Select, Label, FieldError };
