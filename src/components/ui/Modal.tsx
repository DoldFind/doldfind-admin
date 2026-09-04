"use client";

import React, { useEffect, useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  jsonContent: object | null;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  jsonContent,
}) => {
  const [copied, setCopied] = useState(false);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const jsonString = jsonContent ? JSON.stringify(jsonContent, null, 2) : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy JSON: ", err);
    }
  };

  // Simple function to highlight JSON keys/values using basic HTML spans
  const renderHighlightedJson = (json: string) => {
    if (!json) return null;
    
    // Simple regex highlighter
    return json.split("\n").map((line, idx) => {
      // Find keys in quotes e.g. "title":
      const keyRegex = /^(\s*)"([^"]+)":/;
      const keyMatch = line.match(keyRegex);
      
      if (keyMatch) {
        const indent = keyMatch[1];
        const key = keyMatch[2];
        const rest = line.substring(keyMatch[0].length);
        
        return (
          <div key={idx} className="font-mono text-xs leading-relaxed">
            <span className="text-neutral-600">{indent}</span>
            <span className="text-white font-medium">&quot;{key}&quot;</span>
            <span className="text-neutral-400">:</span>
            {renderJsonValue(rest)}
          </div>
        );
      }
      
      return (
        <div key={idx} className="font-mono text-xs leading-relaxed text-neutral-300">
          {line}
        </div>
      );
    });
  };

  const renderJsonValue = (valueStr: string) => {
    const trimmed = valueStr.trim();
    if (trimmed.startsWith('"')) {
      return <span className="text-white/80"> {trimmed}</span>;
    } else if (trimmed === "true" || trimmed === "false") {
      return <span className="text-white font-medium"> {trimmed}</span>;
    } else if (!isNaN(Number(trimmed.replace(/,$/, "")))) {
      return <span className="text-white/90"> {trimmed}</span>;
    } else if (trimmed === "null") {
      return <span className="text-neutral-500"> {trimmed}</span>;
    }
    return <span className="text-neutral-400"> {valueStr}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-200 animate-fadeIn"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#0e0e0e] border border-white/15 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-zoomIn z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content (Scrollable JSON view) */}
        <div className="flex-1 overflow-auto p-5 bg-[#0e0e0e] relative">
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>

          <pre className="overflow-x-auto select-text pt-4 pb-2 pr-12 scrollbar-thin text-xs">
            <code>{renderHighlightedJson(jsonString)}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 flex justify-end gap-2 bg-[#0e0e0e]">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" onClick={handleCopy} className="flex items-center gap-1.5">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            Copy &amp; Close
          </Button>
        </div>
      </div>
    </div>
  );
};
