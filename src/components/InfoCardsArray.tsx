"use client";

import React from "react";
import { useFieldArray, Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { PlaceFormValues } from "@/types/place";

interface InfoCardsArrayProps {
  control: Control<PlaceFormValues>;
  register: UseFormRegister<PlaceFormValues>;
  errors: FieldErrors<PlaceFormValues>;
}

export const InfoCardsArray: React.FC<InfoCardsArrayProps> = ({
  control,
  register,
  errors,
}) => {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "infoCards",
  });

  return (
    <div className="w-full bg-[#121212] border border-white/10 rounded-xl p-5 md:p-6 flex flex-col gap-4">
      {/* Header */}
      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
        Information Cards
      </h3>

      {/* Dynamic Fields List */}
      <div className="flex flex-col gap-4">
        {fields.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {fields.map((field, index) => {
              const cardError = errors.infoCards?.[index];

              return (
                <div
                  key={field.id}
                  className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 bg-[#141414] border border-white/10 rounded-lg transition-colors"
                >
                  {/* Label */}
                  <div className="w-full md:flex-1">
                    <Input
                      {...register(`infoCards.${index}.label` as const)}
                      placeholder="Label (e.g. Parking)"
                      error={cardError?.label?.message}
                      className="bg-[#0e0e0e]"
                    />
                  </div>

                  {/* Value */}
                  <div className="w-full md:flex-1">
                    <Input
                      {...register(`infoCards.${index}.value` as const)}
                      placeholder="Value (e.g. Free)"
                      error={cardError?.value?.message}
                      className="bg-[#0e0e0e]"
                    />
                  </div>

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1 mt-1 md:mt-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                      className="p-2 text-neutral-400 hover:text-white bg-[#0e0e0e] border border-white/10 disabled:opacity-30 disabled:pointer-events-none rounded-lg transition-colors"
                      title="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, index + 1)}
                      className="p-2 text-neutral-400 hover:text-white bg-[#0e0e0e] border border-white/10 disabled:opacity-30 disabled:pointer-events-none rounded-lg transition-colors"
                      title="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-neutral-400 hover:text-red-400 bg-[#0e0e0e] border border-white/10 hover:border-red-500/30 rounded-lg transition-colors mt-1 md:mt-0 flex-shrink-0 self-end md:self-auto"
                    title="Remove Card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-white/10 rounded-lg select-none">
            <span className="text-xs text-neutral-500">No cards added</span>
          </div>
        )}
      </div>

      {/* Append Trigger */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => append({ label: "", value: "" })}
        className="w-fit flex items-center gap-1.5 self-start"
      >
        <Plus className="w-4 h-4" />
        Add Card
      </Button>
    </div>
  );
};
