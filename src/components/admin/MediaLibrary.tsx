"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Upload,
  Search,
  Grid3x3,
  List,
  Plus,
  FolderPlus,
  Trash2,
  Edit2,
  Tag,
  X,
  ChevronDown,
  Loader,
  AlertCircle,
} from "lucide-react";

interface MediaFolder {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  sort_order: number;
}

interface MediaAsset {
  id: string;
  store_id: string;
  folder_id: string | null;
  filename: string;
  original_filename: string;
  file_path: string;
  file_url: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  title: string | null;
  alt_text: string | null;
  description: string | null;
  tags: string[];
  is_featured: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface MediaLibraryProps {
  initialFolders: MediaFolder[];
  initialAssets: MediaAsset[];
  storeId: string;
}

type ViewType = "grid" | "list";
type SortType = "newest" | "oldest" | "name" | "size";

export default function MediaLibrary({
  initialFolders,
  initialAssets,
  storeId,
}: MediaLibraryProps) {
  const supabase = createClient();
  const dragRef = useRef<HTMLDivElement>(null);

  // State
  const [viewType, setViewType] = useState<ViewType>("grid");
  const [sortBy, setSortBy] = useState<SortType>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<MediaFolder[]>(initialFolders);
  const [assets, setAssets] = useState<MediaAsset[]>(initialAssets);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editAsset, setEditAsset] = useState<Partial<MediaAsset> | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [error, setError] = useState<string | null>(null);

  // Filter and sort assets
  const filteredAssets = assets
    .filter((asset) => {
      const inFolder =
        selectedFolderId === null || asset.folder_id === selectedFolderId;
      const matchesSearch =
        asset.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return inFolder && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
          );
        case "name":
          return (a.title || a.filename).localeCompare(
            b.title || b.filename
          );
        case "size":
          return b.file_size - a.file_size;
        default:
          return 0;
      }
    });

  // Get folder structure for sidebar
  const buildFolderTree = (
    parentId: string | null = null,
    level = 0
  ): MediaFolder[] => {
    return folders.filter((f) => f.parent_id === parentId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    setIsLoading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress((i / files.length) * 100);

        if (!file.type.startsWith("image/")) {
          console.warn(`Skipping non-image file: ${file.name}`);
          continue;
        }

        // Call upload API
        const formData = new FormData();
        formData.append("file", file);
        formData.append("storeId", storeId);
        if (selectedFolderId) {
          formData.append("folderId", selectedFolderId);
        }

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Upload failed");
        }

        const newAsset = await response.json();
        setAssets((prev) => [newAsset, ...prev]);
      }

      setUploadProgress(0);
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to upload files"
      );
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleFileInput = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.currentTarget.files;
    if (files) {
      await uploadFiles(Array.from(files));
      e.currentTarget.value = "";
    }
  };

  const createFolder = async () => {
    if (!folderName.trim()) return;

    setIsLoading(true);
    try {
      const slug = folderName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");

      const { data, error: err } = await supabase
        .from("media_folders")
        .insert({
          store_id: storeId,
          name: folderName,
          slug,
          parent_id: selectedFolderId,
          sort_order: folders.length,
        })
        .select()
        .single();

      if (err) throw err;

      if (data) {
        setFolders((prev) => [...prev, data as MediaFolder]);
      }
      setFolderName("");
      setShowFolderModal(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create folder"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const saveAssetChanges = async () => {
    if (!editAsset || !selectedAsset) return;

    setIsLoading(true);
    try {
      const { error: err } = await supabase
        .from("media_assets")
        .update({
          title: editAsset.title,
          alt_text: editAsset.alt_text,
          description: editAsset.description,
          tags: editAsset.tags,
        })
        .eq("id", selectedAsset.id);

      if (err) throw err;

      setAssets((prev) =>
        prev.map((a) =>
          a.id === selectedAsset.id
            ? {
                ...a,
                title: editAsset.title || a.title,
                alt_text: editAsset.alt_text || a.alt_text,
                description: editAsset.description || a.description,
                tags: editAsset.tags || a.tags,
              }
            : a
        )
      );

      setSelectedAsset({
        ...selectedAsset,
        title: editAsset.title || selectedAsset.title,
        alt_text: editAsset.alt_text || selectedAsset.alt_text,
        description: editAsset.description || selectedAsset.description,
        tags: editAsset.tags || selectedAsset.tags,
      });

      setShowEditModal(false);
      setEditAsset(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save changes"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAsset = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    setIsLoading(true);
    try {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) return;

      const { error: err } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", assetId);

      if (err) throw err;

      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      if (selectedAsset?.id === assetId) {
        setSelectedAsset(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete asset"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const addTag = (tag: string) => {
    if (!editAsset) return;
    const newTags = [...(editAsset.tags || [])];
    if (!newTags.includes(tag)) {
      newTags.push(tag);
      setEditAsset((prev) =>
        prev ? { ...prev, tags: newTags } : { tags: newTags }
      );
    }
  };

  const removeTag = (tag: string) => {
    if (!editAsset) return;
    setEditAsset((prev) =>
      prev
        ? {
            ...prev,
            tags: (prev.tags || []).filter((t) => t !== tag),
          }
        : null
    );
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-900 font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-600"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Folders */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Folders</h3>
              <button
                onClick={() => setShowFolderModal(true)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-[#9a9080] hover:text-[#3d6b2a] transition-colors"
                title="Create new folder"
              >
                <FolderPlus size={18} />
              </button>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedFolderId(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedFolderId === null
                    ? "bg-[#3d6b2a]/10 text-[#3d6b2a] font-medium"
                    : "text-[#9a9080] hover:bg-gray-100"
                }`}
              >
                All Assets
              </button>

              {buildFolderTree(null).map((folder) => (
                <FolderTreeItem
                  key={folder.id}
                  folder={folder}
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  expandedFolders={expandedFolders}
                  onSelectFolder={setSelectedFolderId}
                  onToggleFolder={toggleFolder}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Upload Area */}
          <div
            ref={dragRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              isDragging
                ? "border-[#3d6b2a] bg-[#3d6b2a]/5"
                : "border-gray-300 bg-white"
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-xl bg-[#3d6b2a]/10">
                <Upload size={24} className="text-[#3d6b2a]" />
              </div>
              <div>
                <p className="text-gray-900 font-medium">
                  Drag and drop your images here
                </p>
                <p className="text-[#9a9080] text-sm">
                  or{" "}
                  <label className="text-[#3d6b2a] cursor-pointer hover:underline">
                    browse files
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInput}
                      disabled={isLoading}
                    />
                  </label>
                </p>
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full max-w-xs mt-2">
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3d6b2a] transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#9a9080] mt-1">
                    {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7060]"
              />
              <input
                type="text"
                placeholder="Search by filename, title, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3d6b2a] focus:ring-1 focus:ring-[#3d6b2a]/20"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3d6b2a]"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
              </select>

              <button
                onClick={() => setViewType(viewType === "grid" ? "list" : "grid")}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {viewType === "grid" ? (
                  <List size={18} />
                ) : (
                  <Grid3x3 size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Assets View */}
          {filteredAssets.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <p className="text-[#9a9080]">No assets found</p>
            </div>
          ) : viewType === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setEditAsset({ ...asset });
                    setShowEditModal(true);
                  }}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#3d6b2a] hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={asset.file_url}
                      alt={asset.alt_text || asset.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {asset.is_featured && (
                      <div className="absolute top-2 right-2 bg-[#3d6b2a] text-white px-2 py-1 rounded text-xs font-semibold">
                        Featured
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {asset.title || asset.filename}
                    </p>
                    {asset.tags.length > 0 && (
                      <p className="text-xs text-[#9a9080] mt-1">
                        {asset.tags.slice(0, 2).join(", ")}
                        {asset.tags.length > 2
                          ? ` +${asset.tags.length - 2}`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080]">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080]">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080]">
                      Size
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#9a9080]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <img
                          src={asset.file_url}
                          alt={asset.filename}
                          className="w-10 h-10 object-cover rounded"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">
                          {asset.title || asset.filename}
                        </div>
                        {asset.tags.length > 0 && (
                          <div className="text-xs text-[#9a9080] mt-1">
                            {asset.tags.join(", ")}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#9a9080]">
                        {(asset.file_size / 1024 / 1024).toFixed(2)} MB
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              setEditAsset({ ...asset });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-[#9a9080] hover:text-[#3d6b2a] hover:bg-gray-100 rounded transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteAsset(asset.id)}
                            className="p-1.5 text-[#9a9080] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      {showFolderModal && (
        <Modal onClose={() => setShowFolderModal(false)}>
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Create New Folder</h2>
            <input
              type="text"
              placeholder="Folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#3d6b2a]"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                disabled={isLoading || !folderName.trim()}
                className="px-4 py-2 bg-[#3d6b2a] text-white rounded-lg hover:bg-[#3d6b2a]/90 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  "Create"
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Asset Modal */}
      {showEditModal && editAsset && selectedAsset && (
        <Modal onClose={() => setShowEditModal(false)}>
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-xl font-bold text-gray-900">Edit Asset</h2>

            {/* Preview */}
            <img
              src={selectedAsset.file_url}
              alt={selectedAsset.filename}
              className="w-full h-48 object-cover rounded-lg"
            />

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={editAsset.title || ""}
                onChange={(e) =>
                  setEditAsset((prev) =>
                    prev ? { ...prev, title: e.target.value } : null
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#3d6b2a]"
              />
            </div>

            {/* Alt Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Text
              </label>
              <input
                type="text"
                value={editAsset.alt_text || ""}
                onChange={(e) =>
                  setEditAsset((prev) =>
                    prev ? { ...prev, alt_text: e.target.value } : null
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#3d6b2a]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editAsset.description || ""}
                onChange={(e) =>
                  setEditAsset((prev) =>
                    prev
                      ? { ...prev, description: e.target.value }
                      : null
                  )
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#3d6b2a]"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {(editAsset.tags || []).map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-1 bg-[#3d6b2a]/10 text-[#3d6b2a] px-2.5 py-1 rounded-lg text-sm"
                  >
                    <Tag size={14} />
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add tag and press Enter"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#3d6b2a]"
                />
              </div>
            </div>

            {/* File Info */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-[#9a9080]">File Name</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedAsset.filename}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#9a9080]">Size</p>
                <p className="text-sm font-medium text-gray-900">
                  {(selectedAsset.file_size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div>
                <p className="text-xs text-[#9a9080]">Dimensions</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedAsset.width && selectedAsset.height
                    ? `${selectedAsset.width}x${selectedAsset.height}`
                    : "—"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditAsset(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteAsset(selectedAsset.id)}
                className="px-4 py-2 text-red-700 border border-red-300 rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
              <button
                onClick={saveAssetChanges}
                disabled={isLoading}
                className="px-4 py-2 bg-[#3d6b2a] text-white rounded-lg hover:bg-[#3d6b2a]/90 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Folder Tree Item Component
function FolderTreeItem({
  folder,
  folders,
  selectedFolderId,
  expandedFolders,
  onSelectFolder,
  onToggleFolder,
}: {
  folder: MediaFolder;
  folders: MediaFolder[];
  selectedFolderId: string | null;
  expandedFolders: Set<string>;
  onSelectFolder: (id: string) => void;
  onToggleFolder: (id: string) => void;
}) {
  const children = folders.filter((f) => f.parent_id === folder.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedFolders.has(folder.id);

  return (
    <div>
      <button
        onClick={() => {
          onSelectFolder(folder.id);
          if (hasChildren) {
            onToggleFolder(folder.id);
          }
        }}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
          selectedFolderId === folder.id
            ? "bg-[#3d6b2a]/10 text-[#3d6b2a] font-medium"
            : "text-[#9a9080] hover:bg-gray-100"
        }`}
      >
        {hasChildren && (
          <ChevronDown
            size={16}
            className={`transition-transform ${isExpanded ? "" : "-rotate-90"}`}
          />
        )}
        {!hasChildren && <div className="w-4" />}
        {folder.name}
      </button>

      {hasChildren && isExpanded && (
        <div className="ml-2">
          {children.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              folders={folders}
              selectedFolderId={selectedFolderId}
              expandedFolders={expandedFolders}
              onSelectFolder={onSelectFolder}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Modal Component
function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full max-h-96 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
