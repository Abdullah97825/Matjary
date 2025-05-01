import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface ThumbnailSelectorProps {
  imageId: string;
  isThumbnail: boolean;
  onSelect: (imageId: string) => void;
  disabled?: boolean;
}

export function ThumbnailSelector({
  imageId,
  isThumbnail,
  onSelect,
  disabled = false
}: ThumbnailSelectorProps) {
  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={() => onSelect(imageId)}
      disabled={disabled}
      type="button"
      className={cn(
        "transition-colors",
        isThumbnail && "bg-yellow-500 hover:bg-yellow-600"
      )}
    >
      <Star className={cn(
        "h-4 w-4",
        isThumbnail && "fill-current"
      )} />
    </Button>
  )
} 