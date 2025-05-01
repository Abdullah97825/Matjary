import { Loader2 } from 'lucide-react'
import React from 'react'

export default function loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold">Matjary</h1>
        <Loader2 className="h-4 w-4 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading store data...</p>
      </div>
    </div>
  )
}
