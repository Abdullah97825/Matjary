// Create new file: components/ui/loading-overlay.tsx
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "./loading-spinner"

interface LoadingOverlayProps {
  isLoading: boolean
  className?: string
}

export function LoadingOverlay({ isLoading, className }: LoadingOverlayProps) {
  if (!isLoading) return null
  
  return (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg",
      className
    )}>
      <LoadingSpinner size="lg" />
    </div>
  )
}