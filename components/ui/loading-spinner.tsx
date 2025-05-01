import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "default" | "sm" | "lg" | "xl";
  className?: string;
}

export function LoadingSpinner({ size = "default", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    default: "h-4 w-4",
    sm: "h-3 w-3",
    lg: "h-6 w-6",
    xl: "h-8 w-8"
  };

  return (
    <Loader2 
      className={cn(
        "animate-spin",
        sizeClasses[size],
        className
      )} 
    />
  );
} 