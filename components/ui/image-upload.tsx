'use client'

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { cn } from "@/lib/utils"
import { ImagePlus } from "lucide-react"

interface ImageUploadProps {
  onUpload: (file: File) => Promise<void>
  isUploading?: boolean
  className?: string
}

export function ImageUpload({
  onUpload,
  isUploading,
  className
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      await onUpload(file)
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await onUpload(file)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-lg border-2 border-dashed",
        dragActive ? "border-primary" : "border-muted-foreground/25",
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      <Button
        type="button"
        variant="ghost"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="absolute inset-0 h-full w-full rounded-lg"
      >
        {isUploading ? (
          <LoadingSpinner className="h-6 w-6" />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">Upload Image</span>
          </div>
        )}
      </Button>
    </div>
  )
} 