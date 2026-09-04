"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller, useWatch, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { placeSchema } from "@/schemas/placeSchema";
import { PlaceFormValues, PlaceDetails } from "@/types/place";
import { normalizePlaceDetails, mapPlaceDetailsToFormValues } from "@/utils/parser";

import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { MultiSelect } from "./ui/MultiSelect";
import { Modal } from "./ui/Modal";
import { QuickInfoSection } from "./QuickInfoSection";
import { ImageSection } from "./ImageSection";

interface PlaceFormProps {
  initialPlace?: PlaceDetails;
  onSuccess?: (updatedPlace: PlaceDetails) => void;
  onCancel?: () => void;
}

export const PlaceForm: React.FC<PlaceFormProps> = ({
  initialPlace,
  onSuccess,
  onCancel,
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PlaceDetails | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<PlaceDetails | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [similarWarning, setSimilarWarning] = useState<string | null>(null);
  const [copiedLive, setCopiedLive] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlaceFormValues>({
    resolver: zodResolver(placeSchema) as unknown as Resolver<PlaceFormValues>,
    mode: "onTouched",
    defaultValues: {
      placeName: "",
      description: "",
      credits: [],
      placeType: "Spot",
      mainCategory: "",
      categories: [],
      images: [],
      city: "",
      area: "",
      state: "",
      latitude: "",
      longitude: "",
      bestTimings: [],
      closedDays: [],
      nearestMetro: "",
      crowdLevel: "",
      safetyNote: "",
      entryFee: "",
      ticketRequired: "",
      bestSeason: {
        startMonth: "October",
        endMonth: "March",
      },
      openingHours: {
        mode: "24h",
        sameTime: {
          start: "09:00 AM",
          end: "06:00 PM",
        },
        days: {
          Monday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
          Tuesday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
          Wednesday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
          Thursday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
          Friday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
          Saturday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
          Sunday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
        },
      },
      transportType: "Bus",
    },
  });

  // Watch form values in real time to calculate live attributes JSON payload
  const watchedFormValues = useWatch({ control });
  const livePayload = useMemo(() => {
    return normalizePlaceDetails((watchedFormValues || {}) as PlaceFormValues);
  }, [watchedFormValues]);

  // Dynamically load place data into form fields when initialPlace changes (edit mode)
  useEffect(() => {
    if (initialPlace) {
      reset(mapPlaceDetailsToFormValues(initialPlace));
    } else {
      reset({
        placeName: "",
        description: "",
        credits: [],
        placeType: "Spot",
        mainCategory: "",
        categories: [],
        images: [],
        city: "",
        area: "",
        state: "",
        latitude: "",
        longitude: "",
        bestTimings: [],
        closedDays: [],
        nearestMetro: "",
        crowdLevel: "",
        safetyNote: "",
        entryFee: "",
        ticketRequired: "",
        bestSeason: {
          startMonth: "October",
          endMonth: "March",
        },
        openingHours: {
          mode: "24h",
          sameTime: {
            start: "09:00 AM",
            end: "06:00 PM",
          },
          days: {
            Monday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
            Tuesday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
            Wednesday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
            Thursday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
            Friday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
            Saturday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
            Sunday: { status: "open", start: "09:00 AM", end: "06:00 PM" },
          },
        },
        transportType: "Bus",
      });
    }
  }, [initialPlace, reset]);

  const handleOpenPreview = () => {
    const rawValues = getValues();
    const normalized = normalizePlaceDetails(rawValues);
    setPreviewData(normalized);
    setIsPreviewOpen(true);
  };

  const onSubmit = async (data: PlaceFormValues) => {
    await executeSubmit(data, false);
  };

  const executeSubmit = async (data: PlaceFormValues, force: boolean) => {
    setApiError(null);
    setSubmitSuccess(null);
    if (!force) {
      setSimilarWarning(null);
    }
    try {
      const isEdit = !!initialPlace;
      let url = isEdit ? `/api/places/${initialPlace.id}` : "/api/places/submit";
      if (!isEdit && force) {
        url += "?force=true";
      }
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const normalized = normalizePlaceDetails(data);
        if (isEdit) {
          normalized.id = initialPlace.id;
          normalized.uploaderId = initialPlace.uploaderId;
          normalized.createdAt = initialPlace.createdAt;
          normalized.updatedAt = new Date().toISOString();
          if (onSuccess) {
            onSuccess(normalized);
          }
        } else {
          if (result.submissionId) {
            normalized.id = result.submissionId;
          }
          setSubmitSuccess(normalized);
          setSimilarWarning(null);
        }
      } else {
        if (result.error?.code === "SIMILAR_PLACE_WARNING") {
          setSimilarWarning(result.error.message);
        } else {
          setApiError(result.error?.message || "An unexpected error occurred during submission.");
        }
      }
    } catch {
      setApiError("Failed to connect to the server. Please try again.");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    reset();
    setSubmitSuccess(null);
    setApiError(null);
    setSimilarWarning(null);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Error Alert */}
      {apiError && (
        <div className="border border-red-500/30 bg-red-950/20 rounded-xl p-4 text-xs text-red-400 animate-fadeIn">
          {apiError}
        </div>
      )}

      {/* Similarity Warning Alert */}
      {similarWarning && (
        <div className="border border-white/20 bg-[#161616] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <p className="text-xs text-neutral-300 leading-relaxed">
            {similarWarning}
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSimilarWarning(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const values = getValues();
                executeSubmit(values, true);
              }}
              variant="primary"
            >
              Proceed
            </Button>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {submitSuccess && (
        <div className="border border-white/20 bg-[#161616] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <p className="text-xs text-white">
            Place submitted successfully.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPreviewData(submitSuccess);
                setIsPreviewOpen(true);
              }}
            >
              View JSON
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
            >
              New Entry
            </Button>
          </div>
        </div>
      )}

      {/* Main Form Dashboard */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-[#121212]/60 border border-white/10 rounded-xl p-5 flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 border-b border-white/10 pb-2">
                Information
              </h3>

              <Input
                label="Place Name"
                placeholder="e.g. Hidden Waterfall"
                error={errors.placeName?.message}
                {...register("placeName")}
              />

              <Controller
                control={control}
                name="categories"
                render={({ field }) => (
                  <MultiSelect
                    label="Categories"
                    placeholder="Search or add categories"
                    selected={field.value}
                    onChange={field.onChange}
                    error={errors.categories?.message}
                  />
                )}
              />

              <Textarea
                label="Description"
                placeholder="Details about this place..."
                error={errors.description?.message}
                {...register("description")}
              />
            </div>

            {/* Images Section */}
            <ImageSection control={control} errors={errors} setValue={setValue} getValues={getValues} />

            {/* Quick Information Section */}
            <QuickInfoSection
              control={control}
              register={register}
              errors={errors}
            />
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            <div className="bg-[#121212]/60 border border-white/10 rounded-xl p-5 flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 border-b border-white/10 pb-2">
                Coordinates
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Latitude"
                  placeholder="36.2704"
                  error={errors.latitude?.message}
                  {...register("latitude")}
                />
                <Input
                  label="Longitude"
                  placeholder="-121.8081"
                  error={errors.longitude?.message}
                  {...register("longitude")}
                />
              </div>
            </div>

            {/* Live Attributes Payload JSON Card */}
            <div className="bg-[#121212]/60 border border-white/10 rounded-xl p-5 flex flex-col gap-3 sticky top-20">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Live JSON
                </h3>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(livePayload, null, 2));
                    setCopiedLive(true);
                    setTimeout(() => setCopiedLive(false), 2000);
                  }}
                  className="text-[10px] py-1 px-2.5"
                >
                  {copiedLive ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="bg-[#0e0e0e] p-3 rounded-lg border border-white/10 max-h-[420px] overflow-y-auto font-mono text-[11px] leading-relaxed text-neutral-300 scrollbar-thin select-text">
                <pre className="whitespace-pre-wrap font-mono">
                  {JSON.stringify(livePayload, null, 2)}
                </pre>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 bg-[#121212]/60 border border-white/10 rounded-xl p-4">
          {onCancel && (
            <Button
              variant="secondary"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={handleOpenPreview}
            type="button"
          >
            Preview JSON
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {initialPlace ? "Save" : "Submit"}
          </Button>
        </div>
      </form>

      {/* JSON Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="JSON Preview"
        jsonContent={previewData}
      />
    </div>
  );
};
