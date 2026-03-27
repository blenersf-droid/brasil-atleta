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
import { Input } from "@/components/ui/input";
import { MODALITIES } from "@/lib/constants/modalities";

const PERIOD_OPTIONS = [
  { value: "1y", label: "Ultimo ano" },
  { value: "2y", label: "Ultimos 2 anos" },
  { value: "all", label: "Todo o periodo" },
];

export function ScoutingFilters({
  currentModality,
  currentCategory,
  currentPeriod,
  currentFunctionalClass,
}: {
  currentModality: string;
  currentCategory: string;
  currentPeriod: string;
  currentFunctionalClass?: string;
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
      {/* Modality select */}
      <Select
        value={currentModality}
        onValueChange={(value) => updateParam("modality", value ?? "")}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Modalidade" />
        </SelectTrigger>
        <SelectContent>
          {MODALITIES.map((m) => (
            <SelectItem key={m.code} value={m.code}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category input */}
      <Input
        type="text"
        placeholder="Categoria (ex: sub-17)"
        defaultValue={currentCategory}
        className="h-9 w-[180px]"
        onChange={(e) => {
          const value = e.target.value;
          const timeout = setTimeout(() => updateParam("category", value), 400);
          return () => clearTimeout(timeout);
        }}
      />

      {/* Period select */}
      <Select
        value={currentPeriod || "all"}
        onValueChange={(value) => updateParam("period", value ?? "all")}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Periodo" />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Functional class filter (paralympic) */}
      <Input
        type="text"
        placeholder="Classe funcional (ex: T11)"
        defaultValue={currentFunctionalClass ?? ""}
        className="h-9 w-[200px]"
        onChange={(e) => {
          const value = e.target.value;
          const timeout = setTimeout(() => updateParam("functional_class", value), 400);
          return () => clearTimeout(timeout);
        }}
      />
    </div>
  );
}
