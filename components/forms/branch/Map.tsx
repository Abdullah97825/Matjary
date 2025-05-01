"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Define interface for Leaflet icon prototype with the missing property
interface LeafletIconDefaultPrototype extends L.Icon.Default {
  _getIconUrl?: string;
}

// Fix Leaflet default marker icon issue
delete ((L.Icon.Default.prototype as LeafletIconDefaultPrototype)._getIconUrl);
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

interface MapProps {
  latitude: number;
  longitude: number;
  zoom: number;
  readOnly?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
  onZoomChange?: (zoom: number) => void;
}

export default function Map({
  latitude,
  longitude,
  zoom,
  readOnly,
  onLocationChange,
}: MapProps) {
  const center: [number, number] = [latitude, longitude];

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
    // dragging={!readOnly}
    // touchZoom={!readOnly}
    // doubleClickZoom={!readOnly}
    // scrollWheelZoom={!readOnly}
    // zoomControl={!readOnly}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={center}
        draggable={!readOnly}
        eventHandlers={{
          dragend: !readOnly ? (e) => {
            const marker = e.target;
            const position = marker.getLatLng();
            onLocationChange?.(position.lat, position.lng);
          } : () => { },
        }}
      />
      <MapController center={center} zoom={zoom} />
    </MapContainer>
  );
} 