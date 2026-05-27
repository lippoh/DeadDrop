"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { compressImage } from "@/lib/image-utils";

interface ImageUploadButtonProps {
  onImageSelected: (base64: string, fileName: string) => void;
}

export default function ImageUploadButton({ onImageSelected }: ImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const base64 = await compressImage(file);
      setPreview(base64);
      onImageSelected(base64, file.name);
    } catch (err) {
      console.error("Image processing failed:", err);
      alert("Failed to process image.");
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function clearPreview() {
    setPreview(null);
    onImageSelected("", "");
  }

  return (
    <div className="flex items-center gap-1">
      {/* Preview thumbnail */}
      {preview && (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-10 h-10 rounded-lg object-cover border border-zinc-700"
          />
          <button
            type="button"
            onClick={clearPreview}
            className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Upload button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 disabled:opacity-50 transition-colors shrink-0"
        aria-label="Upload image"
        title="Upload image"
      >
        {uploading ? (
          <div className="h-5 w-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <ImagePlus className="h-5 w-5" />
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Select image file"
      />
    </div>
  );
}