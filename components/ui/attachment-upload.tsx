'use client'

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { cn } from "@/lib/utils"
import { FileUp } from "lucide-react"

interface AttachmentUploadProps {
  onUpload: (file: File) => Promise<void>
  isUploading?: boolean
  className?: string
}

export function AttachmentUpload({ onUpload, isUploading, className }: AttachmentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
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
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      if (fileExtension && ['pdf', 'doc', 'docx', 'txt'].includes(fileExtension)) {
        await onUpload(file)
      }
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await onUpload(file)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-lg border-2 border-dashed h-32",
        dragActive ? "border-primary" : "border-muted-foreground/25",
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt"
      />
      <Button
        type="button"
        variant="ghost"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="absolute inset-0 h-full w-full rounded-lg"
      >
        {isUploading ? (
          <LoadingSpinner className="h-6 w-6" />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FileUp className="h-6 w-6" />
            <span className="text-xs">Upload Attachment</span>
            <span className="text-xs text-muted-foreground">
              or drag and drop
            </span>
          </div>
        )}
      </Button>
    </div>
  )
} 