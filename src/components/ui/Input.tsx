import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, type = "text", id, ...props }, ref) => {
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
          <input
            ref={ref}
            type={type}
            id={id}
            className={`w-full bg-[#141414] border ${
              error ? "border-red-500/60 focus:border-red-400" : "border-white/10 focus:border-white/60 focus:ring-1 focus:ring-white/20"
            } rounded-lg px-3.5 py-2 text-xs text-white placeholder:text-neutral-600 transition-colors outline-none ${className}`}
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

Input.displayName = "Input";
