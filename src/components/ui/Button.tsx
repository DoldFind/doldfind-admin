import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      fullWidth = false,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-white/40 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]";

    const variants = {
      primary:
        "bg-white text-black hover:bg-neutral-200 border border-white font-semibold",
      secondary:
        "bg-[#171717] hover:bg-[#222222] text-white border border-white/10 hover:border-white/25",
      outline:
        "bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/5 text-white",
      danger:
        "bg-[#171717] border border-red-500/30 text-red-400 hover:bg-red-950/40 hover:border-red-500/60",
      ghost:
        "bg-transparent text-neutral-400 hover:text-white hover:bg-white/5",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-xs font-semibold",
      lg: "px-5 py-2.5 text-sm font-semibold",
    };

    const widthStyles = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
