"use client";

import { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { UploadCloud, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Uploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...droppedFiles]);
    setStatus("idle");
    setMessage("");
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter((file) =>
        file.type.startsWith("image/")
      );
      setFiles((prev) => [...prev, ...selectedFiles]);
      setStatus("idle");
      setMessage("");
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setStatus("idle");
    setMessage("Compressing images...");

    try {
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          return await imageCompression(file, options);
        })
      );

      setMessage("Uploading to storage...");
      const formData = new FormData();
      compressedFiles.forEach((file, index) => {
        // preserve the original file name because browser-image-compression sometimes renames to 'blob'
        formData.append("files", file, files[index].name);
      });

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed on the server");

      setFiles([]);
      setStatus("success");
      setMessage(`Successfully uploaded ${files.length} image(s)!`);
      
      // Dispatch custom event to notify ImageGallery
      window.dispatchEvent(new CustomEvent("photos-updated"));
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage("An error occurred during upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all",
          isDragging
            ? "border-black bg-zinc-50 dark:border-white dark:bg-zinc-800/50"
            : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/30"
        )}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
            <UploadCloud className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div>
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Click or drag images here
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Supports multiple PNG, JPG, or WEBP files
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Selected Files ({files.length})
          </h3>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {files.map((file, i) => (
              <li
                key={i}
                className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  disabled={isUploading}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {status !== "idle" && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl p-4 text-sm font-medium",
            status === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
          )}
        >
          {status === "success" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {message}
        </div>
      )}

      {isUploading && status === "idle" && (
        <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4 text-sm font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          {message}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading}
          className="flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {isUploading ? "Uploading..." : "Upload Files"}
        </button>
      </div>
    </div>
  );
}
