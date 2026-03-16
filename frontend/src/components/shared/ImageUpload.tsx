"use client";

import { useCallback, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  images: File[];
  setImages: (images: File[]) => void;
  existingImages?: { url: string; publicId?: string; public_id?: string }[];
  onRemoveExisting?: (public_id: string) => void;
  maxImages?: number;
  className?: string;
}

export default function ImageUpload({
  images,
  setImages,
  existingImages = [],
  onRemoveExisting,
  maxImages = 10,
  className,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const totalImages = images.length + existingImages.length;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      const remaining = maxImages - totalImages;
      if (remaining > 0) {
        setImages([...images, ...files.slice(0, remaining)]);
      }
    },
    [images, setImages, maxImages, totalImages]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const remaining = maxImages - totalImages;
      if (remaining > 0) {
        setImages([...images, ...files.slice(0, remaining)]);
      }
      e.target.value = "";
    },
    [images, setImages, maxImages, totalImages]
  );

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          totalImages >= maxImages && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => {
          if (totalImages < maxImages) {
            document.getElementById("image-upload-input")?.click();
          }
        }}
      >
        <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-blue-600">Click to upload</span>{" "}
          or drag and drop
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PNG, JPG, WEBP up to 5MB ({totalImages}/{maxImages} images)
        </p>
        <input
          id="image-upload-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          disabled={totalImages >= maxImages}
        />
      </div>

      {/* Preview grid */}
      {(existingImages.length > 0 || images.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Existing images */}
          {existingImages.map((img) => (
            <div
              key={img.publicId || img.public_id || img.url}
              className="relative group aspect-square rounded-lg overflow-hidden border"
            >
              <Image
                src={img.url}
                alt="Property"
                fill
                className="object-cover"
              />
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(img.publicId || img.public_id || "")}
                  disabled={!img.publicId && !img.public_id}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {/* New images */}
          {images.map((file, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border"
            >
              <Image
                src={URL.createObjectURL(file)}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                {file.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
