"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const BUCKET = "oply-images";

/**
 * Uploads directly to Supabase Storage from the browser and reports back the
 * resulting object path — never the file bytes. The generate request then
 * carries only that path (see config/tools.ts's FieldType "image" doc),
 * which is what keeps a base64 image from ever hitting the 200KB request-size
 * ceiling in lib/security/validation.ts.
 */
export function ImageFieldInput({
  id,
  value,
  onChange,
  disabled,
  required,
}: {
  id: string;
  value: string;
  onChange: (path: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Please choose a PNG, JPEG or WEBP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("That image is too large. The limit is 10MB.");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to upload an image.");
        setPreviewUrl(null);
        return;
      }

      const extension =
        file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${user.id}/uploads/${crypto.randomUUID()}.${extension}`;

      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;

      onChange(path);
    } catch {
      toast.error("Could not upload that image. Please try again.");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setPreviewUrl(null);
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        disabled={disabled || uploading}
        required={required && !value}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {previewUrl ? (
        <div className="relative overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element -- a locally-picked file has no next/image-compatible remote source */}
          <img src={previewUrl} alt="" className="h-40 w-full object-cover" />
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">Uploading…</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={clear}
              aria-label="Remove image"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <label
          htmlFor={id}
          className={cn(
            "flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground",
            (disabled || uploading) && "pointer-events-none opacity-60",
          )}
        >
          <ImagePlus className="h-5 w-5" aria-hidden="true" />
          Click to upload an image
        </label>
      )}
    </div>
  );
}
