"use client";

import React, { useState, useRef } from "react";
import { Control, Controller, FieldErrors, UseFormSetValue, UseFormGetValues } from "react-hook-form";
import {
  Image as ImageIcon,
  UploadCloud,
  X,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Edit2,
  Info,
} from "lucide-react";
import { PlaceFormValues, ImageCredit } from "@/types/place";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";

interface ImageSectionProps {
  control: Control<PlaceFormValues>;
  errors: FieldErrors<PlaceFormValues>;
  setValue?: UseFormSetValue<PlaceFormValues>;
  getValues?: UseFormGetValues<PlaceFormValues>;
}

const CC_LICENSE_PRESETS: { label: string; value: string; url: string }[] = [
  { label: "CC BY-SA 4.0 (Attribution-ShareAlike)", value: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" },
  { label: "CC BY 4.0 (Attribution)", value: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
  { label: "CC BY-NC 4.0 (NonCommercial)", value: "CC BY-NC 4.0", url: "https://creativecommons.org/licenses/by-nc/4.0/" },
  { label: "CC BY-NC-SA 4.0 (NonCommercial-ShareAlike)", value: "CC BY-NC-SA 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/" },
  { label: "CC BY-ND 4.0 (NoDerivatives)", value: "CC BY-ND 4.0", url: "https://creativecommons.org/licenses/by-nd/4.0/" },
  { label: "CC BY-NC-ND 4.0 (NonCommercial-NoDerivatives)", value: "CC BY-NC-ND 4.0", url: "https://creativecommons.org/licenses/by-nc-nd/4.0/" },
  { label: "CC0 1.0 (Public Domain Dedication)", value: "CC0 1.0", url: "https://creativecommons.org/publicdomain/zero/1.0/" },
  { label: "Public Domain Mark", value: "Public Domain", url: "https://creativecommons.org/publicdomain/mark/1.0/" },
  { label: "Custom / All Rights Reserved", value: "Custom / All Rights Reserved", url: "" },
];

export const ImageSection: React.FC<ImageSectionProps> = ({ control, errors }) => {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAutoRetrieving, setIsAutoRetrieving] = useState(false);
  const [autoRetrieveSuccess, setAutoRetrieveSuccess] = useState<string | null>(null);
  const [editingCreditIndex, setEditingCreditIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    files: FileList | File[],
    currentImages: string[],
    currentCredits: ImageCredit[],
    onImagesChange: (val: string[]) => void,
    onCreditsChange: (val: ImageCredit[]) => void
  ) => {
    setErrorMessage(null);
    if (!files || files.length === 0) return;

    const remainingCapacity = 10 - currentImages.length;
    if (remainingCapacity <= 0) {
      setErrorMessage("Maximum limit of 10 images reached");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingCapacity);
    setIsUploading(true);

    const uploadedUrls: string[] = [];
    const newCredits: ImageCredit[] = [...currentCredits];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      setUploadProgress(`Uploading ${i + 1}/${filesToUpload.length}: ${file.name}...`);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (res.ok && data.success && data.data?.url) {
          const newUrl = data.data.url;
          const nextIndex = currentImages.length + uploadedUrls.length;
          uploadedUrls.push(newUrl);

          newCredits.push({
            imageIndex: nextIndex,
            imageUrl: newUrl,
            author: "Swapna Sahoo",
            authorUrl: "",
            source: "Direct Upload / Original Work",
            sourceUrl: "",
            license: "CC BY-SA 4.0",
            licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
            title: file.name.replace(/\.[^/.]+$/, ""),
          });
        } else {
          setErrorMessage(data.error?.message || `Failed to upload ${file.name}`);
        }
      } catch {
        setErrorMessage(`Network error uploading ${file.name}`);
      }
    }

    if (uploadedUrls.length > 0) {
      const updatedImages = [...currentImages, ...uploadedUrls];
      onImagesChange(updatedImages);
      onCreditsChange(newCredits);
    }

    setIsUploading(false);
    setUploadProgress(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 md:p-6 backdrop-blur-md flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-850 pb-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-violet-400" />
            Appwrite Cloud Storage &amp; CC Attribution Gallery
          </h3>
          <p className="text-xs text-slate-500">
            Upload images or paste links. Each image includes structured Creative Commons credits (TASL).
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
              activeTab === "upload"
                ? "bg-violet-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
              activeTab === "url"
                ? "bg-violet-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Paste Link
          </button>
        </div>
      </div>

      <Controller
        control={control}
        name="images"
        render={({ field: imagesField }) => {
          const currentImages: string[] = imagesField.value || [];

          return (
            <Controller
              control={control}
              name="credits"
              render={({ field: creditsField }) => {
                const currentCredits: ImageCredit[] = creditsField.value || [];

                const updateCreditAt = (index: number, updatedFields: Partial<ImageCredit>) => {
                  const newCredits = currentCredits.map((credit, idx) => {
                    if (idx === index) {
                      return { ...credit, ...updatedFields, imageIndex: idx };
                    }
                    return credit;
                  });
                  creditsField.onChange(newCredits);
                };

                const handleAddUrl = async () => {
                  setErrorMessage(null);
                  setAutoRetrieveSuccess(null);
                  const trimmed = newImageUrl.trim();
                  if (!trimmed) {
                    setErrorMessage("Please enter a valid image URL");
                    return;
                  }
                  if (currentImages.includes(trimmed)) {
                    setErrorMessage("This image URL is already added");
                    return;
                  }
                  if (currentImages.length >= 10) {
                    setErrorMessage("Maximum limit of 10 images reached");
                    return;
                  }

                  let finalUrl = trimmed;
                  let creditItem: ImageCredit = {
                    imageIndex: currentImages.length,
                    imageUrl: trimmed,
                    author: "Unknown Contributor",
                    authorUrl: "",
                    source: "Direct Web URL",
                    sourceUrl: trimmed,
                    license: "CC BY-SA 4.0",
                    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
                    title: "",
                  };

                  // Check if domain is Wikimedia Commons or Flickr for Auto Retrieval
                  const isWikimedia = trimmed.includes("wikimedia.org") || trimmed.includes("wikipedia.org");
                  const isFlickr = trimmed.includes("flickr.com") || trimmed.includes("flic.kr");

                  if (isWikimedia || isFlickr) {
                    setIsAutoRetrieving(true);
                    try {
                      const res = await fetch(`/api/metadata?url=${encodeURIComponent(trimmed)}`);
                      const result = await res.json();

                      if (res.ok && result.success && result.data) {
                        if (result.data.imageUrl) {
                          finalUrl = result.data.imageUrl;
                        }
                        creditItem = {
                          imageIndex: currentImages.length,
                          imageUrl: finalUrl,
                          author: result.data.author || "Wikimedia Commons Contributor",
                          authorUrl: result.data.authorUrl || "",
                          source: result.data.source || (isWikimedia ? "Wikimedia Commons" : "Flickr"),
                          sourceUrl: result.data.sourceUrl || trimmed,
                          license: result.data.license || "CC BY-SA 4.0",
                          licenseUrl: result.data.licenseUrl || "https://creativecommons.org/licenses/by-sa/4.0/",
                          title: result.data.title || "",
                        };

                        setAutoRetrieveSuccess(
                          `Auto-retrieved CC attribution from ${result.data.source}: "${creditItem.author} (${creditItem.license})"`
                        );
                      } else {
                        setErrorMessage(result.error?.message || "Failed to auto-retrieve metadata from Wikimedia/Flickr.");
                      }
                    } catch {
                      setErrorMessage("Network error auto-retrieving metadata.");
                    } finally {
                      setIsAutoRetrieving(false);
                    }
                  } else {
                    setAutoRetrieveSuccess(
                      "Direct URL attached. Auto-retrieval is supported specifically for Wikimedia Commons and Flickr links."
                    );
                  }

                  const updatedImages = [...currentImages, finalUrl];
                  const updatedCredits = [...currentCredits, creditItem];

                  imagesField.onChange(updatedImages);
                  creditsField.onChange(updatedCredits);
                  setNewImageUrl("");
                };

                const handleRemoveImage = (indexToRemove: number) => {
                  const updatedImages = currentImages.filter((_, idx) => idx !== indexToRemove);
                  const updatedCredits = currentCredits
                    .filter((_, idx) => idx !== indexToRemove)
                    .map((credit, newIdx) => ({
                      ...credit,
                      imageIndex: newIdx,
                      imageUrl: updatedImages[newIdx] || credit.imageUrl,
                    }));

                  imagesField.onChange(updatedImages);
                  creditsField.onChange(updatedCredits);

                  if (editingCreditIndex === indexToRemove) {
                    setEditingCreditIndex(null);
                  } else if (editingCreditIndex !== null && editingCreditIndex > indexToRemove) {
                    setEditingCreditIndex(editingCreditIndex - 1);
                  }
                };

                return (
                  <div className="flex flex-col gap-4">
                    {/* Tab 1: Upload File to Appwrite Bucket */}
                    {activeTab === "upload" && (
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (!isUploading) {
                            handleFileUpload(
                              e.dataTransfer.files,
                              currentImages,
                              currentCredits,
                              imagesField.onChange,
                              creditsField.onChange
                            );
                          }
                        }}
                        className="border-2 border-dashed border-slate-800 hover:border-violet-600/60 bg-slate-950/40 hover:bg-slate-950/70 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-3 transition cursor-pointer select-none group"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          disabled={isUploading}
                          onChange={(e) => {
                            if (e.target.files) {
                              handleFileUpload(
                                e.target.files,
                                currentImages,
                                currentCredits,
                                imagesField.onChange,
                                creditsField.onChange
                              );
                            }
                          }}
                        />

                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2 py-2">
                            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                            <span className="text-xs font-semibold text-violet-300">
                              {uploadProgress || "Uploading file to Appwrite Bucket..."}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="p-3 bg-slate-900 group-hover:bg-violet-950/40 border border-slate-800 group-hover:border-violet-700/50 rounded-full transition">
                              <UploadCloud className="w-6 h-6 text-violet-400" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <p className="text-xs font-bold text-slate-300">
                                Click to select or drag & drop images here
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Appwrite Bucket handles JPEG, PNG, WEBP, GIF, SVG (up to 10MB each)
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Tab 2: Paste Direct URL */}
                    {activeTab === "url" && (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <div className="flex-1">
                            <Input
                              placeholder="Paste Wikimedia Commons or Flickr URL (e.g. https://commons.wikimedia.org/wiki/File:...)"
                              value={newImageUrl}
                              onChange={(e) => {
                                setNewImageUrl(e.target.value);
                                if (errorMessage) setErrorMessage(null);
                                if (autoRetrieveSuccess) setAutoRetrieveSuccess(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddUrl();
                                }
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={handleAddUrl}
                            disabled={isAutoRetrieving}
                            variant="secondary"
                            className="sm:self-start bg-slate-900 border-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 py-2.5 px-4"
                          >
                            {isAutoRetrieving ? (
                              <>
                                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                                Retrieving...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 text-violet-400" />
                                Add &amp; Auto-Retrieve
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          ⚡ Auto-retrieval automatically extracts image attribution &amp; license metadata for <strong className="text-slate-300">Wikimedia Commons</strong> and <strong className="text-slate-300">Flickr</strong> URLs.
                        </p>
                      </div>
                    )}

                    {/* Status & Error Messages */}
                    {autoRetrieveSuccess && (
                      <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-955/40 border border-emerald-900/50 p-2.5 rounded-lg animate-fadeIn">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>{autoRetrieveSuccess}</span>
                      </div>
                    )}

                    {errorMessage && (
                      <div className="flex items-center gap-2 text-xs font-medium text-red-400 bg-red-955/40 border border-red-900/50 p-2.5 rounded-lg animate-fadeIn">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {errors.images && (
                      <span className="text-xs font-medium text-red-400 animate-fadeIn">
                        {errors.images.message}
                      </span>
                    )}

                    {/* Uploaded Images Gallery Grid & Attribute Preview */}
                    {currentImages.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-850 pb-2">
                          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
                            Attached Photos &amp; CC Attributions ({currentImages.length}/10)
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Click &quot;Edit CC&quot; on any photo to customize attribution details
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {currentImages.map((imgUrl, index) => {
                            const isAppwriteBucket = imgUrl.includes("/storage/buckets/");
                            const credit = currentCredits[index] || {
                              imageIndex: index,
                              imageUrl: imgUrl,
                              author: "Unknown Author",
                              source: "Upload",
                              license: "CC BY-SA 4.0",
                            };

                            let domainStr = "";
                            try {
                              domainStr = new URL(imgUrl).hostname;
                            } catch {
                              domainStr = "external-link";
                            }

                            const isEditing = editingCreditIndex === index;

                            return (
                              <div
                                key={index}
                                className={`flex flex-col rounded-xl overflow-hidden border bg-slate-950/80 shadow-lg transition-all ${
                                  isEditing ? "border-violet-500 ring-1 ring-violet-500/40" : "border-slate-800 hover:border-slate-700"
                                }`}
                              >
                                {/* Photo Thumbnail with overlay actions */}
                                <div className="relative aspect-video w-full overflow-hidden bg-slate-900 flex items-center justify-center group">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={imgUrl}
                                    alt={`Place photo ${index + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />

                                  {/* Badges */}
                                  <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                                    {index === 0 && (
                                      <span className="bg-violet-600/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md">
                                        Primary
                                      </span>
                                    )}
                                    <span className="text-[9px] font-mono text-slate-300 bg-slate-950/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-slate-800">
                                      #{index} {domainStr}
                                    </span>
                                  </div>

                                  {/* Top Right Quick Actions */}
                                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                                    <a
                                      href={imgUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition shadow"
                                      title="Open image full view"
                                    >
                                      <LinkIcon className="w-3 h-3" />
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImage(index)}
                                      className="p-1.5 bg-red-955/90 hover:bg-red-900 border border-red-800 rounded-lg text-red-300 transition shadow"
                                      title="Remove photo"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Appwrite Badge */}
                                  {isAppwriteBucket && (
                                    <span className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-900/60 text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      Bucket
                                    </span>
                                  )}
                                </div>

                                {/* Attribution Summary & Edit Trigger */}
                                <div className="p-3 flex flex-col gap-2 border-t border-slate-850/80 bg-slate-950/40 text-xs">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-col min-w-0">
                                      <div className="flex items-center gap-1.5 text-slate-300 font-bold truncate">
                                        <ShieldCheck className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                                        <span className="truncate">{credit.author || "Unknown Author"}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 truncate">
                                        <span className="text-emerald-400 font-semibold">{credit.license || "CC BY-SA 4.0"}</span>
                                        <span>•</span>
                                        <span className="truncate">{credit.source || "Contributor"}</span>
                                      </div>
                                    </div>

                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => setEditingCreditIndex(isEditing ? null : index)}
                                      className="text-[10px] py-1 px-2 flex items-center gap-1 flex-shrink-0 bg-slate-900 border-slate-800 hover:bg-slate-850"
                                    >
                                      <Edit2 className="w-3 h-3 text-violet-400" />
                                      {isEditing ? "Done" : "Edit CC"}
                                    </Button>
                                  </div>

                                  {/* Inline CC Details Editor */}
                                  {isEditing && (
                                    <div className="flex flex-col gap-2.5 pt-2.5 border-t border-slate-850 animate-fadeIn text-[11px]">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-violet-300 uppercase text-[9px] tracking-wider flex items-center gap-1">
                                          <Info className="w-3 h-3 text-violet-400" />
                                          CC Attribution Editor (Image #{index})
                                        </span>
                                      </div>

                                      {/* Author Name */}
                                      <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-400">Author / Creator Name *</label>
                                        <input
                                          type="text"
                                          placeholder="e.g. Ximonic (Simo Räsänen)"
                                          value={credit.author || ""}
                                          onChange={(e) => updateCreditAt(index, { author: e.target.value })}
                                          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                                        />
                                      </div>

                                      {/* Creative Commons License Preset */}
                                      <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-400">License *</label>
                                        <select
                                          value={credit.license || "CC BY-SA 4.0"}
                                          onChange={(e) => {
                                            const selectedPreset = CC_LICENSE_PRESETS.find((p) => p.value === e.target.value);
                                            updateCreditAt(index, {
                                              license: e.target.value,
                                              licenseUrl: selectedPreset ? selectedPreset.url : credit.licenseUrl,
                                            });
                                          }}
                                          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                                        >
                                          {CC_LICENSE_PRESETS.map((preset) => (
                                            <option key={preset.value} value={preset.value}>
                                              {preset.label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Source */}
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col gap-1">
                                          <label className="text-[10px] font-bold text-slate-400">Source Name</label>
                                          <input
                                            type="text"
                                            placeholder="e.g. Wikimedia Commons"
                                            value={credit.source || ""}
                                            onChange={(e) => updateCreditAt(index, { source: e.target.value })}
                                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                                          />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                          <label className="text-[10px] font-bold text-slate-400">Title / Subject</label>
                                          <input
                                            type="text"
                                            placeholder="e.g. Lake View"
                                            value={credit.title || ""}
                                            onChange={(e) => updateCreditAt(index, { title: e.target.value })}
                                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                                          />
                                        </div>
                                      </div>

                                      {/* Source URL & License URL */}
                                      <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-400">Source File Page URL</label>
                                        <input
                                          type="text"
                                          placeholder="https://commons.wikimedia.org/wiki/File:..."
                                          value={credit.sourceUrl || ""}
                                          onChange={(e) => updateCreditAt(index, { sourceUrl: e.target.value })}
                                          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                                        />
                                      </div>

                                      <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-400">License URL</label>
                                        <input
                                          type="text"
                                          placeholder="https://creativecommons.org/licenses/..."
                                          value={credit.licenseUrl || ""}
                                          onChange={(e) => updateCreditAt(index, { licenseUrl: e.target.value })}
                                          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                                        />
                                      </div>

                                      <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-400">Author Profile URL</label>
                                        <input
                                          type="text"
                                          placeholder="https://..."
                                          value={credit.authorUrl || ""}
                                          onChange={(e) => updateCreditAt(index, { authorUrl: e.target.value })}
                                          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Live JSON Payload Previews */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          {/* Images Array JSON Preview */}
                          <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 flex flex-col gap-2 font-mono text-xs">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans border-b border-slate-850 pb-1.5">
                              <span className="font-bold text-violet-400 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                &quot;images&quot; Live Payload ({currentImages.length})
                              </span>
                            </div>
                            <pre className="text-[11px] text-emerald-400/90 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-900 max-h-48 overflow-y-auto">
                              {JSON.stringify(currentImages, null, 2)}
                            </pre>
                          </div>

                          {/* Credits Array JSON Preview */}
                          <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 flex flex-col gap-2 font-mono text-xs">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans border-b border-slate-850 pb-1.5">
                              <span className="font-bold text-violet-400 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                &quot;credits&quot; Live Payload ({currentCredits.length} CC Record{currentCredits.length > 1 ? "s" : ""})
                              </span>
                            </div>
                            <pre className="text-[11px] text-emerald-400/90 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-900 max-h-48 overflow-y-auto">
                              {JSON.stringify(currentCredits, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3 bg-slate-950/30 border border-dashed border-slate-850 rounded-xl select-none flex flex-col items-center gap-1">
                        <p className="text-xs text-slate-400">No images attached yet.</p>
                        <p className="text-[10px] text-slate-500">
                          Add image URLs or upload files to update the &quot;images&quot; and &quot;credits&quot; JSON payload in real time.
                        </p>
                      </div>
                    )}
                  </div>
                );
              }}
            />
          );
        }}
      />
    </div>
  );
};
