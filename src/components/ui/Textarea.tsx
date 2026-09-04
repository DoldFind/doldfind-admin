import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, helperText, id, rows = 4, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-[11px] font-medium tracking-wide text-neutral-400 select-none"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={id}
            rows={rows}
            className={`w-full bg-[#141414] border ${
              error ? "border-red-500/60 focus:border-red-400" : "border-white/10 focus:border-white/60 focus:ring-1 focus:ring-white/20"
            } rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 transition-colors outline-none resize-y ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <span className="text-[11px] font-medium text-red-400 select-none animate-fadeIn">
            {error}
          </span>
        ) : helperText ? (
          <span className="text-[10px] text-neutral-500 select-none">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
