"use client";

import { useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AlertType, AlertSeverity } from "@/types/database";

const TYPE_OPTIONS: { value: AlertType | "all"; label: string }[] = [
  { value: "all", label: "Todos os tipos" },
  { value: "progression_spike", label: "Progressão" },
  { value: "talent_detected", label: "Talento" },
  { value: "dropout_risk", label: "Risco de Evasão" },
];

const SEVERITY_OPTIONS: { value: AlertSeverity | "all"; label: string }[] = [
  { value: "all", label: "Todas as severidades" },
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
];

export function AlertFilters({
  currentType,
  currentSeverity,
}: {
  currentType?: AlertType;
  currentSeverity?: AlertSeverity;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Type select */}
      <Select
        value={currentType ?? "all"}
        onValueChange={(value) => updateParam("type", value ?? "all")}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Tipo de alerta" />
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Severity select */}
      <Select
        value={currentSeverity ?? "all"}
        onValueChange={(value) => updateParam("severity", value ?? "all")}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Severidade" />
        </SelectTrigger>
        <SelectContent>
          {SEVERITY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
