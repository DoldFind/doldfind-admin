"use client";

import React, { useState, useRef } from "react";
import { Control, Controller, FieldErrors, UseFormSetValue, UseFormGetValues } from "react-hook-form";
import {
  UploadCloud,
  X,
  Link as LinkIcon,
  Loader2,
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
  { label: "CC BY-SA 3.0 (Attribution-ShareAlike)", value: "CC BY-SA 3.0", url: "https://creativecommons.org/licenses/by-sa/3.0/" },
  { label: "CC BY 4.0 (Attribution)", value: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
  { label: "CC BY 3.0 (Attribution)", value: "CC BY 3.0", url: "https://creativecommons.org/licenses/by/3.0/" },
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
    <div className="bg-[#121212]/60 border border-white/10 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Images
        </h3>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-[#141414] p-0.5 rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-2.5 py-1 text-xs font-medium rounded transition ${
              activeTab === "upload"
                ? "bg-white text-black font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`px-2.5 py-1 text-xs font-medium rounded transition ${
              activeTab === "url"
                ? "bg-white text-black font-semibold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            URL
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
                  const trimmed = newImageUrl.trim();
                  if (!trimmed) {
                    setErrorMessage("Enter an image URL");
                    return;
                  }
                  if (currentImages.includes(trimmed)) {
                    setErrorMessage("Image already added");
                    return;
                  }
                  if (currentImages.length >= 10) {
                    setErrorMessage("Maximum limit reached");
                    return;
                  }

                  let finalUrl = trimmed;
                  let creditItem: ImageCredit = {
                    imageIndex: currentImages.length,
                    imageUrl: trimmed,
                    author: "Unknown Author",
                    authorUrl: "",
                    source: "Web URL",
                    sourceUrl: trimmed,
                    license: "Unknown",
                    licenseUrl: "",
                    title: "",
                  };

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
                          author: result.data.author || "Unknown Author",
                          authorUrl: result.data.authorUrl || "",
                          source: result.data.source || (isWikimedia ? "Wikimedia Commons" : "Flickr"),
                          sourceUrl: result.data.sourceUrl || trimmed,
                          license: result.data.license || "Unknown",
                          licenseUrl: result.data.licenseUrl || "",
                          title: result.data.title || "",
                        };
                      }
                    } catch {
                      // Handled silently or set error
                    } finally {
                      setIsAutoRetrieving(false);
                    }
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
                    {/* Tab 1: Upload File */}
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
                        className="border border-dashed border-white/15 hover:border-white/40 bg-[#141414]/40 hover:bg-[#141414] rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 transition cursor-pointer select-none"
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
                          <div className="flex items-center gap-2 py-2 text-xs text-neutral-300">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                            <span>{uploadProgress || "Uploading..."}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-neutral-400">
                            <UploadCloud className="w-4 h-4 text-neutral-400" />
                            <span>Drop images here or browse</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 2: Paste Direct URL */}
                    {activeTab === "url" && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Image URL"
                            value={newImageUrl}
                            onChange={(e) => {
                              setNewImageUrl(e.target.value);
                              if (errorMessage) setErrorMessage(null);
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
                          size="md"
                        >
                          {isAutoRetrieving ? "..." : "Add"}
                        </Button>
                      </div>
                    )}

                    {/* Status & Error Messages */}
                    {errorMessage && (
                      <div className="text-xs text-red-400 animate-fadeIn">
                        {errorMessage}
                      </div>
                    )}

                    {errors.images && (
                      <span className="text-xs text-red-400 animate-fadeIn">
                        {errors.images.message}
                      </span>
                    )}

                    {/* Uploaded Images Gallery Grid */}
                    {currentImages.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {currentImages.map((imgUrl, index) => {
                          const credit = currentCredits[index] || {
                            imageIndex: index,
                            imageUrl: imgUrl,
                            author: "Unknown Author",
                            source: "Upload",
                            license: "CC BY-SA 4.0",
                          };

                          const isEditing = editingCreditIndex === index;

                          return (
                            <div
                              key={index}
                              className={`flex flex-col rounded-xl overflow-hidden border bg-[#141414] transition-all ${
                                isEditing ? "border-white/40" : "border-white/10"
                              }`}
                            >
                              {/* Photo Thumbnail */}
                              <div className="relative aspect-video w-full overflow-hidden bg-black flex items-center justify-center group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imgUrl}
                                  alt={`Image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />

                                {/* Top Right Quick Actions */}
                                <div className="absolute top-2 right-2 flex items-center gap-1">
                                  <a
                                    href={imgUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 bg-black/70 hover:bg-black rounded text-neutral-300 hover:text-white transition"
                                  >
                                    <LinkIcon className="w-3 h-3" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="p-1 bg-black/70 hover:bg-red-950 rounded text-neutral-300 hover:text-red-400 transition"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Attribution Summary & Edit Trigger */}
                              <div className="p-2.5 flex flex-col gap-2 border-t border-white/10 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-white text-xs font-medium truncate">
                                      {credit.author || "Unknown Author"}
                                    </span>
                                    <span className="text-[10px] text-neutral-500 truncate">
                                      {credit.license || "CC BY-SA 4.0"}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setEditingCreditIndex(isEditing ? null : index)}
                                    className="text-[10px] py-1 px-2 text-neutral-400 hover:text-white border border-white/10 rounded transition"
                                  >
                                    {isEditing ? "Done" : "Credit"}
                                  </button>
                                </div>

                                {/* Inline CC Details Editor */}
                                {isEditing && (
                                  <div className="flex flex-col gap-2 pt-2 border-t border-white/10 animate-fadeIn text-[11px]">
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[10px] text-neutral-400">Author</label>
                                      <input
                                        type="text"
                                        value={credit.author || ""}
                                        onChange={(e) => updateCreditAt(index, { author: e.target.value })}
                                        className="bg-[#0e0e0e] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-white"
                                      />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                      <label className="text-[10px] text-neutral-400">License</label>
                                      <select
                                        value={credit.license || "CC BY-SA 4.0"}
                                        onChange={(e) => {
                                          const selectedPreset = CC_LICENSE_PRESETS.find((p) => p.value === e.target.value);
                                          updateCreditAt(index, {
                                            license: e.target.value,
                                            licenseUrl: selectedPreset ? selectedPreset.url : credit.licenseUrl,
                                          });
                                        }}
                                        className="bg-[#0e0e0e] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-white"
                                      >
                                        {CC_LICENSE_PRESETS.map((preset) => (
                                          <option key={preset.value} value={preset.value}>
                                            {preset.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-neutral-400">Source</label>
                                        <input
                                          type="text"
                                          value={credit.source || ""}
                                          onChange={(e) => updateCreditAt(index, { source: e.target.value })}
                                          className="bg-[#0e0e0e] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-white"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-neutral-400">Title</label>
                                        <input
                                          type="text"
                                          value={credit.title || ""}
                                          onChange={(e) => updateCreditAt(index, { title: e.target.value })}
                                          className="bg-[#0e0e0e] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-white"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 border border-dashed border-white/10 rounded-xl text-xs text-neutral-500">
                        No images attached.
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
