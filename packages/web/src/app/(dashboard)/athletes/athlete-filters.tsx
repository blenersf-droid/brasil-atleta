"use client";

import { useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODALITIES } from "@/lib/constants/modalities";
import { BRAZILIAN_STATES } from "@/lib/constants/states";
import { cn } from "@/lib/utils";

const LEVEL_OPTIONS = [
  { value: "school", label: "Base Escolar" },
  { value: "state", label: "Estadual" },
  { value: "national", label: "Nacional" },
  { value: "elite", label: "Alto Rendimento" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "retired", label: "Aposentado" },
];

export function AthleteFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.delete("page");
      return params.toString();
    },
    [searchParams]
  );

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      params.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const handleFilterChange = useCallback(
    (name: string, value: string) => {
      startTransition(() => {
        router.replace(`${pathname}?${createQueryString(name, value)}`);
      });
    },
    [pathname, router, createQueryString]
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-2")}>
      {/* Search Input */}
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar atleta..."
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            const timeout = setTimeout(() => handleSearch(value), 400);
            return () => clearTimeout(timeout);
          }}
          className="pl-8 h-8"
        />
      </div>

      {/* Modality Filter */}
      <Select
        defaultValue={searchParams.get("modality") ?? "all"}
        onValueChange={(value) => handleFilterChange("modality", value ?? "all")}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Modalidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas modalidades</SelectItem>
          {MODALITIES.map((m) => (
            <SelectItem key={m.code} value={m.code}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Level Filter */}
      <Select
        defaultValue={searchParams.get("level") ?? "all"}
        onValueChange={(value) => handleFilterChange("level", value ?? "all")}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Nivel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os niveis</SelectItem>
          {LEVEL_OPTIONS.map((l) => (
            <SelectItem key={l.value} value={l.value}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* State Filter */}
      <Select
        defaultValue={searchParams.get("state") ?? "all"}
        onValueChange={(value) => handleFilterChange("state", value ?? "all")}
      >
        <SelectTrigger className="w-[130px]">
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

      {/* Status Filter */}
      <Select
        defaultValue={searchParams.get("status") ?? "all"}
        onValueChange={(value) => handleFilterChange("status", value ?? "all")}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
