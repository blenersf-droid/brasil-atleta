"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function MarkReadButton({ alertId }: { alertId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleMarkRead() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/alerts/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? "Erro ao marcar como lido");
      }

      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Falha ao marcar como lido", { description: message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="xs"
      onClick={handleMarkRead}
      disabled={isLoading}
      className="gap-1 text-xs text-[#0a1628]/60 hover:text-[#0a1628]"
    >
      {isLoading ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <Check className="size-3" />
      )}
      Marcar como lido
    </Button>
  );
}
