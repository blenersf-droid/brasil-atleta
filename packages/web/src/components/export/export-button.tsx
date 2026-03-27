"use client";

import { Download, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCSV } from "@/lib/export/csv";

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  label?: string;
}

export function ExportButton({
  data,
  filename,
  label = "Exportar",
}: ExportButtonProps) {
  function handleCSV() {
    downloadCSV(data, filename);
  }

  function handlePDF() {
    window.print();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="default">
            <Download className="size-4" />
            {label}
          </Button>
        }
      />
      <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
        <DropdownMenuItem onClick={handleCSV}>
          <FileText className="size-4" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePDF}>
          <Printer className="size-4" />
          Imprimir PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
