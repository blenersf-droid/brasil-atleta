"use client";

import { useState } from "react";
import { Share2, Check, Link as LinkIcon } from "lucide-react";

interface ShareButtonProps {
  url: string;
  athleteName: string;
}

export function ShareButton({ url, athleteName }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    // Try Web Share API first (mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${athleteName} — Brasil Atleta`,
          text: `Confira o portfolio esportivo de ${athleteName} no Brasil Atleta!`,
          url,
        });
        return;
      } catch {
        // User cancelled share or API not available — fall through to copy
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard API not available — do nothing
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-medium text-gray-600 shadow-sm transition-all hover:border-[#009739]/40 hover:text-[#009739] active:scale-95"
      title="Compartilhar perfil"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-[#009739]" />
          <span className="text-[#009739]">Copiado!</span>
        </>
      ) : (
        <>
          <Share2 className="size-3.5" />
          Compartilhar
        </>
      )}
    </button>
  );
}
