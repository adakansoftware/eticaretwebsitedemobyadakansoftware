"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ImageUploadFieldProps = {
  name: string;
  folder: "products" | "banners" | "brands" | "categories";
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
};

export function ImageUploadField({
  name,
  folder,
  label,
  placeholder,
  defaultValue = "",
  required = false,
  className
}: ImageUploadFieldProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/upload?field=${folder}`, {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as { url?: string; message?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.message ?? "Dosya yuklenemedi.");
      }

      setValue(payload.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Dosya yuklenemedi.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-slate-200">
          {label}
        </label>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          id={inputId}
          name={name}
          type="url"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          required={required}
        />
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Yukleniyor..." : "Dosya Yukle"}
          </Button>
        </div>
      </div>

      {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
      {value ? <p className="mt-2 text-xs text-slate-400">{value}</p> : null}
    </div>
  );
}
