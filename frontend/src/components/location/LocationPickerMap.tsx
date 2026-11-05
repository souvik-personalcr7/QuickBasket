'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LocateFixed, AlertCircle, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker as MapLibreMarker, MapMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { reverseGeocode } from '@/lib/addressApi';

// Default fallback coordinates: Connaught Place, New Delhi (Center of India's major metro)
const DEFAULT_LAT = 28.6139;
const DEFAULT_LNG = 77.209;

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onChangeLocation: (coords: {
    lat: number;
    lng: number;
    formattedAddress?: string;
    streetSuggestion?: string;
  }) => void;
  className?: string;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  latitude,
  longitude,
  onChangeLocation,
  className = 'h-72 sm:h-80 w-full',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const initialLat = latitude && !isNaN(latitude) ? latitude : DEFAULT_LAT;
  const initialLng = longitude && !isNaN(longitude) ? longitude : DEFAULT_LNG;

  // Handles updating marker and triggering reverse geocode
  const handleLocationUpdate = useCallback(
    async (lat: number, lng: number) => {
      // Reverse geocode to suggest human-readable street/area
      const geocoded = await reverseGeocode(lat, lng);

      onChangeLocation({
        lat,
        lng,
        formattedAddress: geocoded.formattedAddress,
        streetSuggestion: geocoded.street || geocoded.area,
      });
    },
    [onChangeLocation]
  );

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let isMounted = true;

    const initMap = () => {
      if (!isMounted || !mapContainerRef.current) return;

      // Configure web worker path explicitly to fix Next.js / Turbopack worker resolution
      if (typeof window !== 'undefined') {
        try {
          const origin = window.location.origin;
          maplibregl.setWorkerUrl(`${origin}/maplibre-gl-worker.mjs`);
        } catch {
          maplibregl.setWorkerUrl('https://unpkg.com/maplibre-gl@6.16.0/dist/maplibre-gl-worker.mjs');
        }
      }

      // Reliable OpenStreetMap-compatible raster tile specification
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
            },
          },
          layers: [
            {
              id: 'osm-tiles-layer',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [initialLng, initialLat],
        zoom: 15,
        attributionControl: false,
      });

      // Draggable marker with QuickBasket signature emerald color
      const marker = new maplibregl.Marker({
        draggable: true,
        color: '#15803d',
      })
        .setLngLat([initialLng, initialLat])
        .addTo(map);

      // On marker drag end, update position & geocode
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        handleLocationUpdate(lngLat.lat, lngLat.lng);
      });

      // On clicking anywhere on map, move marker to clicked spot
      map.on('click', (e: MapMouseEvent) => {
        const { lng, lat } = e.lngLat;
        marker.setLngLat([lng, lat]);
        map.flyTo({ center: [lng, lat], speed: 1.2 });
        handleLocationUpdate(lat, lng);
      });

      map.on('load', () => {
        if (isMounted) {
          setMapLoaded(true);
        }
      });

      mapRef.current = map;
      markerRef.current = marker;
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [handleLocationUpdate, initialLat, initialLng]);

  // Sync external coordinates changes to map/marker
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) return;

    const currentPos = markerRef.current.getLngLat();
    const isDifferent =
      Math.abs(currentPos.lat - latitude) > 0.0001 ||
      Math.abs(currentPos.lng - longitude) > 0.0001;

    if (isDifferent) {
      markerRef.current.setLngLat([longitude, latitude]);
      mapRef.current.flyTo({ center: [longitude, latitude], speed: 1.2 });
    }
  }, [latitude, longitude]);

  // Use Current Location - Native Geolocation API with explicit click requirement
  const handleUseCurrentLocation = () => {
    setGpsError(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    // Check secure context requirement for production
    if (
      typeof window !== 'undefined' &&
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setGpsError('Geolocation requires a secure HTTPS connection in production.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: userLat, longitude: userLng } = position.coords;
        setIsLocating(false);
        setGpsError(null);

        if (mapRef.current && markerRef.current) {
          markerRef.current.setLngLat([userLng, userLat]);
          mapRef.current.flyTo({ center: [userLng, userLat], zoom: 16, speed: 1.4 });
        }

        handleLocationUpdate(userLat, userLng);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('Location permission denied. Please enable GPS permissions or drag the pin manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('Current location unavailable. Please tap on the map to set your location.');
            break;
          case error.TIMEOUT:
            setGpsError('Location request timed out. Please try again or pick on the map.');
            break;
          default:
            setGpsError('An error occurred while detecting location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs bg-slate-100">
      {/* Map Container */}
      <div ref={mapContainerRef} className={className} />

      {/* Floating "Use Current Location" Action Button */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-emerald-800 shadow-md border border-emerald-100 hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer disabled:opacity-70"
          title="Detect and use my current GPS location"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Detecting GPS...</span>
            </>
          ) : (
            <>
              <LocateFixed className="w-4 h-4 text-emerald-600" />
              <span>Use Current Location</span>
            </>
          )}
        </button>

        {/* Custom Zoom Controls */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden flex flex-col">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-b border-slate-100 transition-colors cursor-pointer"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Interactive Hint Bottom Pill */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-10 pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-medium px-3 py-1.5 rounded-full shadow-md inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Click anywhere on map or drag pin to fine-tune exact delivery spot</span>
        </div>
      </div>

      {/* GPS Error Notification Banner */}
      {gpsError && (
        <div className="absolute top-14 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-sm z-20 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs shadow-md flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{gpsError}</p>
            </div>
            <button
              type="button"
              onClick={() => setGpsError(null)}
              className="text-amber-700 hover:text-amber-900 font-bold ml-1 text-sm"
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
