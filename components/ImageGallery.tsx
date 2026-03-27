"use client";

import { useState, useEffect } from "react";
import { Trash2, Loader2, AlertTriangle, RefreshCcw } from "lucide-react";

interface R2Image {
  key: string;
  url: string;
}

export function ImageGallery() {
  const [images, setImages] = useState<R2Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [bulkTag, setBulkTag] = useState("");
  const [tagging, setTagging] = useState(false);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      // no-store prevents aggressive browser caching
      const res = await fetch("/api/admin/images", { cache: 'no-store' });
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setImages(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setSelectedKeys(new Set()); // Clear selection on reload
    }
  };

  useEffect(() => {
    fetchImages();

    const handleUpdate = () => fetchImages();
    window.addEventListener("photos-updated", handleUpdate);
    return () => window.removeEventListener("photos-updated", handleUpdate);
  }, []);

  const toggleSelect = (key: string) => {
    const newPaths = new Set(selectedKeys);
    if (newPaths.has(key)) {
      newPaths.delete(key);
    } else {
      newPaths.add(key);
    }
    setSelectedKeys(newPaths);
  };

  const handleDelete = () => {
    if (selectedKeys.size === 0) return;
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const keysToDelete = Array.from(selectedKeys);
      const res = await fetch("/api/admin/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: keysToDelete }),
      });

      if (!res.ok) throw new Error("Failed to delete images");
      
      // Optimistically remove images from the UI to avoid broken image links
      setImages(prev => prev.filter(img => !keysToDelete.includes(img.key)));
      setSelectedKeys(new Set());
      setShowConfirm(false);
      
      // Fetch full list in the background
      fetchImages(); 
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkTag = async () => {
    if (selectedKeys.size === 0 || !bulkTag.trim()) return;
    setTagging(true);
    try {
      const keysToTag = Array.from(selectedKeys);
      const res = await fetch("/api/admin/tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: keysToTag, tag: bulkTag }),
      });
      if (!res.ok) throw new Error("Failed to tag images");
      
      setBulkTag("");
      setSelectedKeys(new Set()); // Deselect after tagging
      alert("Successfully tagged images!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setTagging(false);
    }
  };

  if (loading && images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Loading photo gallery...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-red-500">
        <AlertTriangle className="w-8 h-8 mb-4" />
        <p className="font-semibold">{error}</p>
        <button 
          onClick={fetchImages} 
          className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Photo Gallery
          </h2>
          <span className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
            {images.length}
          </span>
          <button
            onClick={fetchImages}
            disabled={loading || deleting}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        
        {selectedKeys.size > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={bulkTag}
              onChange={(e) => setBulkTag(e.target.value)}
              placeholder="Enter tag..."
              className="px-3 py-2 text-sm rounded-xl border-none bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-200 dark:ring-zinc-700 outline-none focus:ring-2 focus:ring-black w-32 dark:text-zinc-100"
            />
            <button
               onClick={handleBulkTag}
               disabled={tagging || !bulkTag.trim()}
               className="bg-black text-white px-4 py-2.5 text-sm rounded-xl font-bold disabled:opacity-50 dark:bg-white dark:text-black shadow-sm"
            >
               {tagging ? "..." : "Tag"}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete ({selectedKeys.size})
            </button>
          </div>
        )}
      </div>

      {images.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <p className="text-zinc-500 font-medium">No photos found in the bucket.</p>
          <p className="text-zinc-400 text-sm mt-1">Upload some using the box above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((img) => {
            const isSelected = selectedKeys.has(img.key);
            return (
              <div
                key={img.key}
                onClick={() => toggleSelect(img.key)}
                className={`group relative cursor-pointer aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden ring-4 transition-all duration-200 ${
                  isSelected 
                    ? "ring-red-500 shadow-md scale-95" 
                    : "ring-transparent hover:ring-zinc-300 dark:hover:ring-zinc-700 hover:scale-[1.02]"
                }`}
              >
                <img
                  src={img.url}
                  alt={img.key}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${isSelected ? "opacity-40 grayscale-[50%]" : "opacity-100"}`}
                  loading="lazy"
                />
                
                <div 
                  className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all duration-200 shadow-sm ${
                    isSelected ? "bg-red-500 text-white scale-110" : "bg-black/40 text-white/70 group-hover:bg-black/60 group-hover:text-white group-hover:scale-110"
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </div>
                
                {isSelected && (
                  <div className="absolute inset-0 border-4 border-red-500 rounded-2xl pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-[2rem] bg-white dark:bg-zinc-900 p-8 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 text-center animate-in fade-in zoom-in duration-200">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
              Delete Photos?
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium">
              Are you sure you want to permanently delete {selectedKeys.size} photo(s)? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-900 transition-all hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50 shadow-md"
                disabled={deleting}
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
