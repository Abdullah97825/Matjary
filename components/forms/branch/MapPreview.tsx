"use client";

import {useState } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';


// Dynamically import the map component
const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted">
      Loading map...
    </div>
  ),
});

interface MapPreviewProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  readOnly?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
  onZoomChange?: (zoom: number) => void;
}

export function MapPreview({
  latitude = 0,
  longitude = 0,
  zoom = 14,
  readOnly = false,
  onLocationChange,
  onZoomChange
}: MapPreviewProps) {
  const [searchValue, setSearchValue] = useState('');
  
  const handleSearch = async () => {
    if (!searchValue.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchValue)}`
      );
      const data = await response.json();
      
      if (data[0]) {
        onLocationChange?.(parseFloat(data[0].lat), parseFloat(data[0].lon));
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex gap-2">
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search location..."
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} type="button" variant="secondary" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className={readOnly ? "h-[200px]" : "h-[400px]"}>
        <Map
          latitude={latitude}
          longitude={longitude}
          zoom={zoom}
          readOnly={readOnly}
          onLocationChange={onLocationChange}
          onZoomChange={onZoomChange}
        />
      </div>
    </div>
  );
} 