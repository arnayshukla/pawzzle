'use client';

import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, X, Check, Copy, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function CustomPackCreator() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [packLink, setPackLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = parseInt(process.env.NEXT_PUBLIC_MAX_CUSTOM_IMAGES || '5', 10);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const totalFiles = [...selectedFiles, ...filesArray].slice(0, MAX_IMAGES);
      setSelectedFiles(totalFiles);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Client-side compression & EXIF stripping via HTML5 Canvas
   */
  const processImageToWebP = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        
        // Target max dimension 1024 to save memory and R2 bandwidth
        const MAX_DIM = 1024;
        let { width, height } = img;
        
        if (width > height && width > MAX_DIM) {
          height *= MAX_DIM / width;
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width *= MAX_DIM / height;
          height = MAX_DIM;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Failed to get canvas context'));
        
        // Drawing the image strips all EXIF metadata natively!
        ctx.drawImage(img, 0, 0, width, height);

        // Compress aggresively to WebP (0.8 quality usually yields ~80KB per image)
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        }, 'image/webp', 0.8);
      };
      
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.src = url;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    setUploadProgress(10);
    
    try {
      const formData = new FormData();
      
      // Process all files through Canvas before network upload
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const compressedBlob = await processImageToWebP(file);
        formData.append('files', compressedBlob, `custom-${i}.webp`);
        setUploadProgress(10 + Math.floor(((i + 1) / selectedFiles.length) * 40)); 
      }

      setUploadProgress(60); // Processing done, hitting API
      
      const res = await fetch('/api/custom/create', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setUploadProgress(100);

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setPackLink(`${window.location.origin}/custom/${data.packId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = () => {
    if (packLink) {
      navigator.clipboard.writeText(packLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (packLink) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl text-center">
        <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Your Pack is Ready!</h3>
        <p className="text-zinc-400 text-sm mb-6">
          Share this link with your friends. It will automatically self-destruct in 7 days!
        </p>
        
        <div className="flex items-center space-x-2 bg-black border border-zinc-800 rounded-xl p-2 mb-6">
          <input 
            type="text" 
            readOnly 
            value={packLink} 
            className="flex-1 bg-transparent text-zinc-300 text-sm px-2 outline-none"
          />
          <button 
            onClick={copyToClipboard}
            className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center justify-center font-bold transition whitespace-nowrap"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <Link 
          href={packLink.replace(window.location.origin, '')}
          className="block w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
        >
          Play Your Puzzle Now
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Camera className="w-6 h-6 text-amber-500" /> Create Custom Pack
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          Upload up to {MAX_IMAGES} photos of your pet. Puzzles self-destruct after 7 days.
        </p>

        {error && (
          <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* File Picker */}
          {selectedFiles.length < MAX_IMAGES && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 px-4 border-2 border-dashed border-zinc-700 hover:border-amber-500 hover:bg-amber-500/10 rounded-xl flex flex-col items-center justify-center text-zinc-400 hover:text-amber-400 transition"
            >
              <UploadCloud className="w-8 h-8 mb-2" />
              <span className="font-bold">Tap to add photos ({selectedFiles.length}/{MAX_IMAGES})</span>
            </button>
          )}

          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            multiple
            className="hidden" 
            onChange={handleFileChange} 
          />

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="relative shrink-0 snap-start">
                  {/* Fake thumbnail via object url just for preview */}
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt="Preview" 
                    className="w-20 h-20 object-cover rounded-xl border border-zinc-700 shadow-sm"
                  />
                  <button 
                    onClick={() => removeFile(idx)}
                    className="absolute -top-2 -right-2 bg-zinc-800 text-red-400 border border-zinc-700 hover:bg-red-500 hover:text-white rounded-full p-1 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={isUploading || selectedFiles.length === 0}
          className={`flex items-center gap-2 px-6 py-3 font-bold rounded-xl shadow-lg transition-transform ${
            selectedFiles.length === 0 
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
              : 'bg-amber-500 hover:bg-amber-600 text-white active:scale-95'
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing... {uploadProgress}%
            </>
          ) : (
            `Upload & Generate Link`
          )}
        </button>
      </div>
    </div>
  );
}
