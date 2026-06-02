"use client";

import { useState, useRef } from "react";
import { Upload, X, FileCheck, AlertCircle } from "lucide-react";

interface UploadedImage {
  id: string;
  url: string;
  filename: string;
  type: "main" | "gallery";
  size: number;
}

interface RecipeImageUploadProps {
  recipeId: string;
  storeId: string;
  onImagesUploaded?: (images: UploadedImage[]) => void;
}

export default function RecipeImageUpload({
  recipeId,
  storeId,
  onImagesUploaded,
}: RecipeImageUploadProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mainImageId, setMainImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dragZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateAndUploadImages = async (files: FileList) => {
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} is not an image file`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} exceeds 10MB limit`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;
    setError(null);
    await uploadImages(validFiles);
  };

  const uploadImages = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newImages: UploadedImage[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("storeId", storeId);
        formData.append("folderId", recipeId);

        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const data = await response.json();

          const uploadedImage: UploadedImage = {
            id: data.id,
            url: data.file_url,
            filename: data.filename,
            type: i === 0 && uploadedImages.length === 0 ? "main" : "gallery",
            size: data.file_size,
          };

          newImages.push(uploadedImage);

          // Update progress
          const progressPercent = Math.round(((i + 1) / totalFiles) * 100);
          setUploadProgress(progressPercent);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Upload failed";
          setError(errorMessage);
          console.error("Image upload error:", err);
        }
      }

      if (newImages.length > 0) {
        setUploadedImages([...uploadedImages, ...newImages]);
        if (!mainImageId && newImages.length > 0) {
          setMainImageId(newImages[0].id);
        }
        onImagesUploaded?.([...uploadedImages, ...newImages]);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isUploading) return;

    const files = e.dataTransfer.files;
    if (files) {
      await validateAndUploadImages(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await validateAndUploadImages(e.target.files);
    }
  };

  const removeImage = (id: string) => {
    const updatedImages = uploadedImages.filter(img => img.id !== id);
    setUploadedImages(updatedImages);
    if (mainImageId === id) {
      setMainImageId(updatedImages.length > 0 ? updatedImages[0].id : null);
    }
    onImagesUploaded?.(updatedImages);
  };

  const setAsMainImage = (id: string) => {
    setMainImageId(id);
  };

  const mainImage = uploadedImages.find(img => img.id === mainImageId);
  const galleryImages = uploadedImages.filter(img => img.id !== mainImageId);

  return (
    <div className="space-y-8">
      {/* Main Image Section */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Main Recipe Image</h3>

        {mainImage ? (
          <div className="space-y-3">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
              <img
                src={mainImage.url}
                alt="Main recipe image"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeImage(mainImage.id)}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-[#9a9080]">{mainImage.filename}</p>
          </div>
        ) : (
          <div
            ref={dragZoneRef}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`aspect-video rounded-lg border-2 border-dashed transition cursor-pointer flex flex-col items-center justify-center ${
              isDragging
                ? "border-green-500 bg-green-50"
                : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
            }`}
          >
            <Upload
              size={32}
              className={`mb-2 transition ${isDragging ? "text-green-600" : "text-[#7a7060]"}`}
            />
            <p className="text-sm font-semibold text-gray-700">
              Drag image here or click to upload
            </p>
            <p className="text-xs text-[#9a9080] mt-1">Max 10MB, PNG/JPG/WebP</p>
          </div>
        )}
      </div>

      {/* Gallery Images Section */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Gallery Images</h3>

        {galleryImages.length > 0 && (
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {galleryImages.map(img => (
              <div key={img.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                  <img
                    src={img.url}
                    alt="Gallery item"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => setAsMainImage(img.id)}
                    title="Set as main image"
                    className="bg-[#3d6b2a] hover:bg-[#2f5720] text-white p-2 rounded transition"
                  >
                    <FileCheck size={16} />
                  </button>
                  <button
                    onClick={() => removeImage(img.id)}
                    title="Remove image"
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Zone */}
        <div
          ref={dragZoneRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`rounded-lg border-2 border-dashed transition cursor-pointer flex flex-col items-center justify-center p-8 ${
            isDragging
              ? "border-green-500 bg-green-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
          } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Upload
            size={24}
            className={`mb-2 transition ${isDragging ? "text-green-600" : "text-[#7a7060]"}`}
          />
          <p className="text-sm font-semibold text-gray-700">
            Add more images for gallery
          </p>
          <p className="text-xs text-[#9a9080] mt-1">Drag and drop or click to browse</p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Progress Bar */}
      {isUploading && (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Uploading images...</p>
              <p className="text-sm font-semibold text-[#3d6b2a]">{uploadProgress}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-[#3d6b2a] transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Upload Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Summary */}
      {uploadedImages.length > 0 && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileCheck size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">
                {uploadedImages.length} image{uploadedImages.length !== 1 ? "s" : ""} uploaded
              </p>
              <p className="text-sm text-green-700">
                {mainImage ? "Main image set" : "No main image selected"} • {galleryImages.length} gallery image{galleryImages.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
