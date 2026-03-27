"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRAZILIAN_STATES } from "@/lib/constants/states";
import type { EntityType } from "@/types/database";

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  school: "Escola",
  club: "Clube",
  training_center: "Centro de Treinamento",
  federation: "Federacao",
  confederation: "Confederacao",
  committee: "Comite",
};

export function EntityFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/entities?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams("search", search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, updateParams]);

  const currentType = searchParams.get("type") ?? "all";
  const currentState = searchParams.get("state") ?? "all";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#0a1628]/30" />
        <Input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-xl border-[#0a1628]/[0.08] bg-white pl-9 text-sm placeholder:text-[#0a1628]/30 focus:border-[#009739] focus:ring-[#009739]/20"
        />
      </div>

      {/* Entity type filter */}
      <Select
        value={currentType}
        onValueChange={(value: string | null) => updateParams("type", value ?? "all")}
      >
        <SelectTrigger className="h-9 w-full rounded-xl border-[#0a1628]/[0.08] bg-white text-sm sm:w-[200px]">
          <SelectValue placeholder="Tipo de entidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tipos</SelectItem>
          {(Object.keys(ENTITY_TYPE_LABELS) as EntityType[]).map((type) => (
            <SelectItem key={type} value={type}>
              {ENTITY_TYPE_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* State filter */}
      <Select
        value={currentState}
        onValueChange={(value: string | null) => updateParams("state", value ?? "all")}
      >
        <SelectTrigger className="h-9 w-full rounded-xl border-[#0a1628]/[0.08] bg-white text-sm sm:w-[160px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os estados</SelectItem>
          {BRAZILIAN_STATES.map((s) => (
            <SelectItem key={s.uf} value={s.uf}>
              {s.uf} — {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
