"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ToolField } from "@/config/tools";
import { cn } from "@/lib/utils";

export function FieldRenderer({
  field,
  value,
  onChange,
  disabled,
  error,
}: {
  field: ToolField;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const id = `field-${field.name}`;
  const describedBy = [
    field.helpText ? `${id}-help` : null,
    error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const showCount =
    field.type === "textarea" && typeof field.maxLength === "number";
  const overLimit = field.maxLength ? value.length > field.maxLength : false;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>
          {field.label}
          {field.required && (
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </Label>
        {showCount && (
          <span
            className={cn(
              "text-[11px] tabular-nums",
              overLimit ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {value.length.toLocaleString()} / {field.maxLength!.toLocaleString()}
          </span>
        )}
      </div>

      {field.type === "textarea" ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.rows ?? 6}
          disabled={disabled}
          required={field.required}
          maxLength={field.maxLength}
          aria-describedby={describedBy || undefined}
          aria-invalid={Boolean(error) || overLimit}
          className={cn(error && "border-destructive")}
          style={{ minHeight: `${(field.rows ?? 6) * 24 + 20}px` }}
        />
      ) : field.type === "select" ? (
        <Select
          value={value || field.defaultValue}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger id={id} aria-describedby={describedBy || undefined}>
            <SelectValue placeholder={field.placeholder ?? "Select…"} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          type={field.type === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          required={field.required}
          maxLength={field.maxLength}
          aria-describedby={describedBy || undefined}
          aria-invalid={Boolean(error)}
          className={cn(error && "border-destructive")}
        />
      )}

      {field.helpText && !error && (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {field.helpText}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
