"use client";

import React, { useState, useEffect, useRef } from "react";
import { Control, UseFormRegister, FieldErrors, Controller } from "react-hook-form";
import {
  AlertCircle,
  Check,
  Search,
  ChevronDown,
  Plus,
} from "lucide-react";

import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { PlaceFormValues, PlaceType } from "@/types/place";
import { mergeTimeSlots, getContinuousDurations } from "@/utils/parser";

interface QuickInfoSectionProps {
  control: Control<PlaceFormValues>;
  register: UseFormRegister<PlaceFormValues>;
  errors: FieldErrors<PlaceFormValues>;
}

const CATEGORY_PRESETS = [
  "Temple",
  "Waterfall",
  "Viewpoint",
  "Beach",
  "Historical Site",
  "Cafe",
  "Park",
  "Forest",
  "Hiking Trail",
  "Lake & River",
  "Ancient Ruins",
  "Cave",
  "Garden",
  "Monument",
  "Museum",
  "Market",
  "Street Food",
];

const PLACE_TYPES: PlaceType[] = ["Spot", "Cafe", "Market"];

const TIME_SLOTS = [
  "12 AM - 1 AM",
  "1 AM - 2 AM",
  "2 AM - 3 AM",
  "3 AM - 4 AM",
  "4 AM - 5 AM",
  "5 AM - 6 AM",
  "6 AM - 7 AM",
  "7 AM - 8 AM",
  "8 AM - 9 AM",
  "9 AM - 10 AM",
  "10 AM - 11 AM",
  "11 AM - 12 PM",
  "12 PM - 1 PM",
  "1 PM - 2 PM",
  "2 PM - 3 PM",
  "3 PM - 4 PM",
  "4 PM - 5 PM",
  "5 PM - 6 PM",
  "6 PM - 7 PM",
  "7 PM - 8 PM",
  "8 PM - 9 PM",
  "9 PM - 10 PM",
  "10 PM - 11 PM",
  "11 PM - 12 AM",
];

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const CROWD_LEVELS = ["Low", "Medium", "High"];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const HOURS_OF_DAY = [
  "12:00 AM", "01:00 AM", "02:00 AM", "03:00 AM", "04:00 AM", "05:00 AM",
  "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
  "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM"
];

export const QuickInfoSection: React.FC<QuickInfoSectionProps> = ({
  control,
  register,
  errors,
}) => {
  const [catSearch, setCatSearch] = useState("");
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (
        catDropdownRef.current &&
        !catDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const filteredCategories = CATEGORY_PRESETS.filter((cat) =>
    cat.toLowerCase().includes(catSearch.toLowerCase())
  );

  return (
    <div className="w-full bg-[#121212] border border-white/10 rounded-xl p-5 md:p-6 flex flex-col gap-6">
      {/* Section Title */}
      <div className="border-b border-white/10 pb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Details
        </h3>
      </div>

      <div className="flex flex-col gap-6">
        {/* Place Type & Main Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Place Type Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-neutral-400 select-none">
              Place Type
            </label>
            <Controller
              control={control}
              name="placeType"
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <div className="flex border border-white/10 rounded-lg p-0.5 bg-[#141414]">
                    {PLACE_TYPES.map((type) => {
                      const isSelected = field.value === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => field.onChange(type)}
                          className={`flex-1 text-center py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                            isSelected
                              ? "bg-white text-black font-semibold"
                              : "text-neutral-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                  {errors.placeType && (
                    <span className="text-xs text-red-400">
                      {errors.placeType.message}
                    </span>
                  )}
                </div>
              )}
            />
          </div>

          {/* Main Category Dropdown */}
          <div ref={catDropdownRef} className="relative flex flex-col gap-2">
            <label className="text-xs font-medium text-neutral-400 select-none">
              Main Category
            </label>
            <Controller
              control={control}
              name="mainCategory"
              render={({ field }) => (
                <>
                  <button
                    type="button"
                    onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                    className={`w-full bg-[#141414] border ${
                      errors.mainCategory
                        ? "border-red-500/80"
                        : "border-white/10 focus:border-white/40"
                    } rounded-lg px-3.5 py-2.5 text-xs text-white flex items-center justify-between transition-colors outline-none text-left`}
                  >
                    <span className={field.value ? "text-white" : "text-neutral-500"}>
                      {field.value || "Select category..."}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isCatDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isCatDropdownOpen && (
                    <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-[#141414] border border-white/15 rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto p-1.5">
                      <div className="flex items-center gap-1.5 bg-[#0e0e0e] border border-white/10 px-2.5 py-1.5 rounded-md mb-1.5">
                        <Search className="w-3.5 h-3.5 text-neutral-500" />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={catSearch}
                          onChange={(e) => setCatSearch(e.target.value)}
                          className="bg-transparent border-none outline-none text-xs text-white w-full focus:ring-0 p-0"
                        />
                      </div>

                      {catSearch.trim() && !CATEGORY_PRESETS.some(opt => opt.toLowerCase() === catSearch.trim().toLowerCase()) && (
                        <button
                          key="custom-main-category"
                          type="button"
                          onClick={() => {
                            field.onChange(catSearch.trim());
                            setIsCatDropdownOpen(false);
                            setCatSearch("");
                          }}
                          className="w-full flex items-center gap-1.5 text-left px-2.5 py-2 text-xs text-white hover:bg-white/10 rounded-md transition-colors mb-1 border border-dashed border-white/20"
                        >
                          <Plus className="w-3.5 h-3.5 text-white" />
                          Add &quot;{catSearch.trim()}&quot;
                        </button>
                      )}

                      {filteredCategories.length > 0 ? (
                        filteredCategories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              field.onChange(cat);
                              setIsCatDropdownOpen(false);
                              setCatSearch("");
                            }}
                            className="w-full flex items-center justify-between text-left px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                          >
                            <span>{cat}</span>
                            {field.value === cat && (
                              <Check className="w-3.5 h-3.5 text-white" />
                            )}
                          </button>
                        ))
                      ) : !catSearch.trim() ? (
                        <div className="px-3 py-3 text-center text-xs text-neutral-500">
                          No categories
                        </div>
                      ) : null}
                    </div>
                  )}
                </>
              )}
            />
            {errors.mainCategory && (
              <span className="text-xs text-red-400">
                {errors.mainCategory.message}
              </span>
            )}
          </div>
        </div>

        {/* Location: City, Area, State */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="City"
            placeholder="e.g. Bhubaneswar"
            error={errors.city?.message}
            {...register("city")}
          />
          <Input
            label="Area"
            placeholder="e.g. Saheed Nagar"
            error={errors.area?.message}
            {...register("area")}
          />
          <Input
            label="State"
            placeholder="e.g. Odisha"
            error={errors.state?.message}
            {...register("state")}
          />
        </div>

        {/* Best Timings */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-neutral-400 select-none">
            Best Timings
          </label>
          <Controller
            control={control}
            name="bestTimings"
            render={({ field }) => {
              const selected: number[] = field.value || [];

              const handleToggleSlot = (idx: number) => {
                let updated: number[];
                if (selected.includes(idx)) {
                  updated = selected.filter((s) => s !== idx);
                } else {
                  updated = [...selected, idx];
                }
                field.onChange(updated);
              };

              const merged = mergeTimeSlots(selected);
              const continuousBlocks = getContinuousDurations(selected);
              const hasOver4Hours = continuousBlocks.some((b) => b > 4);

              return (
                <div className="flex flex-col gap-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                    {TIME_SLOTS.map((slot, idx) => {
                      const isSelected = selected.includes(idx);
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleToggleSlot(idx)}
                          className={`text-center py-2 px-1 text-[11px] font-medium rounded-lg border transition-colors ${
                            isSelected
                              ? "bg-white text-black font-semibold border-white"
                              : "bg-[#141414] border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>

                  {selected.length > 0 && (
                    <div className="bg-[#141414] border border-white/10 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-neutral-400">
                        {selected.length} hour{selected.length > 1 ? "s" : ""} selected &bull; <span className="text-white font-medium">{merged}</span>
                      </span>
                      {hasOver4Hours && (
                        <span className="text-neutral-400 text-[11px] flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-neutral-300" />
                          Max continuous recommended is 4h
                        </span>
                      )}
                    </div>
                  )}

                  {errors.bestTimings && (
                    <span className="text-xs text-red-400">
                      {errors.bestTimings.message}
                    </span>
                  )}
                </div>
              );
            }}
          />
        </div>

        {/* Closed On */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-neutral-400 select-none">
            Closed On
          </label>
          <Controller
            control={control}
            name="closedDays"
            render={({ field }) => {
              const selected: string[] = field.value || [];
              const isNeverClosed = selected.includes("Never Closed");

              const handleToggleDay = (day: string) => {
                let updated: string[];
                if (day === "Never Closed") {
                  updated = ["Never Closed"];
                } else {
                  const baseList = selected.filter((d) => d !== "Never Closed");
                  if (baseList.includes(day)) {
                    updated = baseList.filter((d) => d !== day);
                  } else {
                    updated = [...baseList, day];
                  }
                }
                field.onChange(updated);
              };

              return (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => {
                      const isSelected = selected.includes(day) && !isNeverClosed;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleToggleDay(day)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            isSelected
                              ? "bg-white text-black font-semibold border-white"
                              : "bg-[#141414] border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handleToggleDay("Never Closed")}
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        isNeverClosed
                          ? "bg-white text-black font-semibold border-white"
                          : "bg-[#141414] border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      Never Closed
                    </button>
                  </div>

                  {errors.closedDays && (
                    <span className="text-xs text-red-400">
                      {errors.closedDays.message}
                    </span>
                  )}
                </div>
              );
            }}
          />
        </div>

        {/* Best Season */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-neutral-400 select-none">
            Best Season
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-neutral-500">From Month</span>
              <Controller
                control={control}
                name="bestSeason.startMonth"
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-white/40 transition-colors"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m} className="bg-[#141414] text-white">
                        {m}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-neutral-500">To Month</span>
              <Controller
                control={control}
                name="bestSeason.endMonth"
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full bg-[#141414] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-white/40 transition-colors"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m} className="bg-[#141414] text-white">
                        {m}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>
          {errors.bestSeason && (
            <span className="text-xs text-red-400">
              {errors.bestSeason.message}
            </span>
          )}
        </div>

        {/* Opening Hours */}
        <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
          <label className="text-xs font-medium text-neutral-400 select-none">
            Opening Hours
          </label>
          
          <Controller
            control={control}
            name="openingHours.mode"
            render={({ field }) => {
              const mode = field.value;
              return (
                <div className="flex flex-col gap-3">
                  {/* Mode Tabs */}
                  <div className="flex border border-white/10 rounded-lg p-0.5 bg-[#141414] w-full sm:w-fit">
                    {(["24h", "same", "custom"] as const).map((m) => {
                      const label = m === "24h" ? "24 Hours" : m === "same" ? "Same Everyday" : "Custom Hours";
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => field.onChange(m)}
                          className={`flex-1 sm:flex-initial text-center py-2 px-3.5 text-xs font-medium rounded-md transition-colors ${
                            mode === m
                              ? "bg-white text-black font-semibold"
                              : "text-neutral-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {mode === "24h" && (
                    <div className="bg-[#141414] border border-white/10 rounded-lg p-3">
                      <p className="text-xs text-neutral-300">
                        Open 24 hours every day
                      </p>
                    </div>
                  )}

                  {mode === "same" && (
                    <div className="bg-[#141414] border border-white/10 rounded-lg p-3 flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 flex flex-col gap-1">
                        <span className="text-[11px] text-neutral-500">Start Time</span>
                        <Controller
                          control={control}
                          name="openingHours.sameTime.start"
                          render={({ field: startField }) => (
                            <select
                              {...startField}
                              className="w-full bg-[#0e0e0e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-white/40 transition-colors"
                            >
                              {HOURS_OF_DAY.map((h) => (
                                <option key={h} value={h} className="bg-[#0e0e0e] text-white">{h}</option>
                              ))}
                            </select>
                          )}
                        />
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <span className="text-[11px] text-neutral-500">End Time</span>
                        <Controller
                          control={control}
                          name="openingHours.sameTime.end"
                          render={({ field: endField }) => (
                            <select
                              {...endField}
                              className="w-full bg-[#0e0e0e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-white/40 transition-colors"
                            >
                              {HOURS_OF_DAY.map((h) => (
                                <option key={h} value={h} className="bg-[#0e0e0e] text-white">{h}</option>
                              ))}
                            </select>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {mode === "custom" && (
                    <div className="bg-[#141414] border border-white/10 rounded-lg p-3 flex flex-col gap-2.5">
                      {WEEK_DAYS.map((day) => (
                        <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 last:border-b-0 pb-2 last:pb-0 gap-2">
                          <div className="flex items-center justify-between sm:justify-start gap-4">
                            <span className="text-xs font-medium text-neutral-300 w-24">{day}</span>
                            
                            {/* Open/Closed Toggle */}
                            <Controller
                              control={control}
                              name={`openingHours.days.${day}.status`}
                              render={({ field: statusField }) => (
                                <div className="flex border border-white/10 rounded-lg p-0.5 bg-[#0e0e0e] w-fit">
                                  {(["open", "closed"] as const).map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => statusField.onChange(s)}
                                      className={`py-1 px-2.5 text-[10px] font-medium rounded-md transition-colors ${
                                        statusField.value === s
                                          ? s === "open" ? "bg-white text-black font-semibold" : "bg-neutral-800 text-neutral-300 font-semibold"
                                          : "text-neutral-500 hover:text-white"
                                      }`}
                                    >
                                      {s === "open" ? "Open" : "Closed"}
                                    </button>
                                  ))}
                                </div>
                              )}
                            />
                          </div>

                          {/* Day-specific Time Selectors */}
                          <Controller
                            control={control}
                            name={`openingHours.days.${day}.status`}
                            render={({ field: statusField }) => {
                              const isOpen = statusField.value === "open";
                              return (
                                <div className={`flex items-center gap-2 transition-opacity ${isOpen ? "opacity-100" : "opacity-20 pointer-events-none"}`}>
                                  <Controller
                                    control={control}
                                    name={`openingHours.days.${day}.start`}
                                    render={({ field: startField }) => (
                                      <select
                                        {...startField}
                                        disabled={!isOpen}
                                        className="bg-[#0e0e0e] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-white/40 transition-colors w-28"
                                      >
                                        {HOURS_OF_DAY.map((h) => (
                                          <option key={h} value={h} className="bg-[#0e0e0e] text-white">{h}</option>
                                        ))}
                                      </select>
                                    )}
                                  />
                                  <span className="text-neutral-500 text-xs">-</span>
                                  <Controller
                                    control={control}
                                    name={`openingHours.days.${day}.end`}
                                    render={({ field: endField }) => (
                                      <select
                                        {...endField}
                                        disabled={!isOpen}
                                        className="bg-[#0e0e0e] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-white/40 transition-colors w-28"
                                      >
                                        {HOURS_OF_DAY.map((h) => (
                                          <option key={h} value={h} className="bg-[#0e0e0e] text-white">{h}</option>
                                        ))}
                                      </select>
                                    )}
                                  />
                                </div>
                              );
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }}
          />
          {errors.openingHours && (
            <span className="text-xs text-red-400">
              {errors.openingHours.message}
            </span>
          )}
        </div>

        {/* Nearest Metro, Transport Type & Crowd Level */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Nearest Metro"
            placeholder="e.g. Master Canteen"
            error={errors.nearestMetro?.message}
            {...register("nearestMetro")}
          />

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-neutral-400 select-none">
              Transport Type
            </label>
            <Controller
              control={control}
              name="transportType"
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <div className="flex border border-white/10 rounded-lg p-0.5 bg-[#141414] w-fit min-w-[140px]">
                    {["Bus", "Metro"].map((opt) => {
                      const isSelected = field.value === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => field.onChange(opt)}
                          className={`flex-1 text-center py-2 px-4 text-xs font-medium rounded-md transition-colors ${
                            isSelected
                              ? "bg-white text-black font-semibold"
                              : "text-neutral-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {errors.transportType && (
                    <span className="text-xs text-red-400">
                      {errors.transportType.message}
                    </span>
                  )}
                </div>
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-neutral-400 select-none">
              Crowd Level
            </label>
            <Controller
              control={control}
              name="crowdLevel"
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <div className="flex border border-white/10 rounded-lg p-0.5 bg-[#141414]">
                    {CROWD_LEVELS.map((level) => {
                      const isSelected = field.value === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => field.onChange(level)}
                          className={`flex-1 text-center py-2 px-2 text-xs font-medium rounded-md transition-colors ${
                            isSelected
                              ? "bg-white text-black font-semibold"
                              : "text-neutral-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                  {errors.crowdLevel && (
                    <span className="text-xs text-red-400">
                      {errors.crowdLevel.message}
                    </span>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        {/* Safety Note Textarea */}
        <Textarea
          label="Safety Note"
          placeholder="List any hazards or warnings..."
          error={errors.safetyNote?.message}
          {...register("safetyNote")}
          rows={3}
        />

        {/* Entry Fee & Ticket Required */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/10 pt-4">
          <Input
            label="Entry Fee"
            placeholder="e.g. ₹50 per person"
            error={errors.entryFee?.message}
            {...register("entryFee")}
          />

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-neutral-400 select-none">
              Ticket Required
            </label>
            <Controller
              control={control}
              name="ticketRequired"
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <div className="flex border border-white/10 rounded-lg p-0.5 bg-[#141414] w-fit min-w-[140px]">
                    {(["Yes", "No"] as const).map((opt) => {
                      const isSelected = field.value === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => field.onChange(opt)}
                          className={`flex-1 text-center py-2 px-5 text-xs font-medium rounded-md transition-colors ${
                            isSelected
                              ? "bg-white text-black font-semibold"
                              : "text-neutral-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {errors.ticketRequired && (
                    <span className="text-xs text-red-400">
                      {errors.ticketRequired.message}
                    </span>
                  )}
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
