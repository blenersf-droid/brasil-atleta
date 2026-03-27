"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function GenerateAlertsAction() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/alerts/generate", {
        method: "POST",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? "Erro ao gerar alertas");
      }

      const { count } = await response.json();

      if (count === 0) {
        toast.info("Nenhum novo alerta gerado", {
          description: "Todos os alertas já estão registrados.",
        });
      } else {
        toast.success(`${count} alerta${count !== 1 ? "s" : ""} gerado${count !== 1 ? "s" : ""}`, {
          description: "Os novos alertas de scouting foram criados.",
        });
      }

      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Falha ao gerar alertas", { description: message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      onClick={handleGenerate}
      disabled={isLoading}
      className="shrink-0 gap-1.5 bg-[#009739] text-white hover:bg-[#009739]/90"
      size="sm"
    >
      {isLoading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Sparkles className="size-3.5" />
      )}
      Gerar Alertas
    </Button>
  );
}
