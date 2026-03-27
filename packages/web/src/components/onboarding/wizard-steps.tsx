"use client";
import { cn } from "@/lib/utils";

interface WizardStepsProps {
  steps: string[];
  currentStep: number;
}

export function WizardSteps({ steps, currentStep }: WizardStepsProps) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
              i < currentStep && "bg-[#009739] text-white",
              i === currentStep && "bg-[#009739] text-white ring-4 ring-[#009739]/20",
              i > currentStep && "bg-[#0a1628]/[0.06] text-[#0a1628]/30"
            )}>
              {i < currentStep ? "✓" : i + 1}
            </div>
            <span className={cn(
              "text-xs font-medium hidden sm:block truncate",
              i <= currentStep ? "text-[#0a1628]" : "text-[#0a1628]/30"
            )}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              "h-px flex-1 min-w-[20px]",
              i < currentStep ? "bg-[#009739]" : "bg-[#0a1628]/[0.08]"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
