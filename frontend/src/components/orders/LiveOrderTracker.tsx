'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Bike,
  Store,
  CheckCircle2,
  Clock,
  Phone,
  Navigation,
  ShieldCheck,
  AlertCircle,
  Loader2,
  X,
  Package,
  Radio,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { apiClient } from '@/lib/api';
import { getSocket } from '@/lib/socket';

interface RiderLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  accuracy?: number;
  updatedAt?: string | Date;
}

interface OrderTrackingData {
  _id: string;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  totalAmount: number;
  deliveryAddress: {
    receiverName: string;
    phone: string;
    house: string;
    street: string;
    landmark?: string;
    label?: string;
    location: {
      coordinates: [number, number]; // [lng, lat]
    };
  };
  shop?: {
    name?: string;
    phone?: string;
    shopDetails?: {
      shopName?: string;
      address?: string;
      image?: string;
    };
  };
  deliveryPartner?: {
    name?: string;
    phone?: string;
    avatar?: string;
    deliveryDetails?: {
      vehicleType?: string;
      vehicleNumber?: string;
    };
  } | null;
  riderLocation?: RiderLocation | null;
  placedAt?: string;
  shopAcceptedAt?: string;
  riderAcceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  routeDistanceKm?: number;
  routeEtaMinutes?: number;
  isLiveTrackingActive?: boolean;
}

interface LiveOrderTrackerProps {
  orderId: string;
  onClose?: () => void;
  isModal?: boolean;
}

const LIFECYCLE_STEPS = [
  { key: 'ORDER_PLACED', label: 'Order Placed', desc: 'Order received & waiting for store confirmation' },
  { key: 'SHOP_ACCEPTED', label: 'Store Accepted', desc: 'Store has confirmed and is packing your items' },
  { key: 'FINDING_RIDER', label: 'Finding Rider', desc: 'System is locating the nearest delivery partner' },
  { key: 'RIDER_ASSIGNED', label: 'Rider Assigned', desc: 'Delivery partner assigned to pickup' },
  { key: 'RIDER_ACCEPTED', label: 'Rider Accepted', desc: 'Delivery partner accepted & heading to store' },
  { key: 'PICKED_UP', label: 'Order Picked Up', desc: 'Grocery verified and picked up from store' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider is on the way to your doorstep' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Package delivered fresh at your doorstep' },
];

export const LiveOrderTracker: React.FC<LiveOrderTrackerProps> = ({
  orderId,
  onClose,
  isModal = false,
}) => {
  const [order, setOrder] = useState<OrderTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Location & Route
  const [liveRiderLocation, setLiveRiderLocation] = useState<RiderLocation | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [liveDistanceKm, setLiveDistanceKm] = useState<number | null>(null);
  const [liveEtaMinutes, setLiveEtaMinutes] = useState<number | null>(null);
  const [lastUpdatedSecAgo, setLastUpdatedSecAgo] = useState<number>(0);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const riderMarkerRef = useRef<MapLibreMarker | null>(null);
  const destMarkerRef = useRef<MapLibreMarker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Fetch Order Details
  const fetchOrder = useCallback(async () => {
    try {
      const res = await apiClient<{ order: OrderTrackingData }>(`/orders/${orderId}`);
      if (res.success && res.data?.order) {
        const ord = res.data.order;
        setOrder(ord);
        if (ord.riderLocation) {
          setLiveRiderLocation(ord.riderLocation);
        }
        if (ord.routeDistanceKm) setLiveDistanceKm(ord.routeDistanceKm);
        if (ord.routeEtaMinutes) setLiveEtaMinutes(ord.routeEtaMinutes);
      } else {
        setErrorMsg(res.message || 'Unable to retrieve order details.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error fetching order.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  // Fetch Road Route from backend
  const fetchRoute = useCallback(async () => {
    try {
      const res = await apiClient<{
        route: { coordinates: [number, number][]; distanceKm: number; durationMinutes: number };
      }>(`/orders/${orderId}/route`);
      if (res.success && res.data?.route) {
        setRouteCoordinates(res.data.route.coordinates);
        setLiveDistanceKm(res.data.route.distanceKm);
        setLiveEtaMinutes(res.data.route.durationMinutes);
      }
    } catch {
      // Ignored: route will retry on next coordinate update
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Socket.IO Subscription
  useEffect(() => {
    const socket = getSocket();

    socket.emit('join_order_room', orderId, (ack: any) => {
      if (ack?.success && ack.riderLocation) {
        setLiveRiderLocation(ack.riderLocation);
      }
    });

    // Order status changed
    socket.on('order:status:updated', (data: { orderId: string; status: string; rider?: any; deliveryPartner?: any }) => {
      if (data.orderId === orderId) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                status: data.status,
                ...(data.rider || data.deliveryPartner
                  ? { deliveryPartner: data.rider || data.deliveryPartner }
                  : {}),
              }
            : prev
        );
        fetchRoute();
      }
    });

    // Rider accepted dispatch
    socket.on('rider:delivery:accepted', (data: { orderId: string; rider: any }) => {
      if (data.orderId === orderId) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                status: 'OUT_FOR_DELIVERY',
                deliveryPartner: data.rider,
              }
            : prev
        );
        fetchRoute();
      }
    });

    // Fresh GPS coordinates streamed from rider
    socket.on('customer:rider:location', (data: { orderId: string; latitude: number; longitude: number; heading?: number; accuracy?: number; updatedAt: string }) => {
      if (data.orderId === orderId) {
        const freshLoc: RiderLocation = {
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading,
          accuracy: data.accuracy,
          updatedAt: data.updatedAt,
        };
        setLiveRiderLocation(freshLoc);
        setLastUpdatedSecAgo(0);

        // Smoothly update map marker
        if (riderMarkerRef.current) {
          riderMarkerRef.current.setLngLat([data.longitude, data.latitude]);
        }
      }
    });

    return () => {
      socket.off('order:status:updated');
      socket.off('rider:delivery:accepted');
      socket.off('customer:rider:location');
    };
  }, [orderId, fetchRoute]);

  // Periodic route recalculation & timer
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdatedSecAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize MapLibre GL map when order has location and component is ready
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !order?.deliveryAddress?.location?.coordinates) {
      return;
    }

    const [destLng, destLat] = order.deliveryAddress.location.coordinates;
    const riderLng = liveRiderLocation?.longitude || destLng - 0.012;
    const riderLat = liveRiderLocation?.latitude || destLat + 0.009;

    if (typeof window !== 'undefined') {
      try {
        const origin = window.location.origin;
        maplibregl.setWorkerUrl(`${origin}/maplibre-gl-worker.mjs`);
      } catch {
        maplibregl.setWorkerUrl('https://unpkg.com/maplibre-gl@6.16.0/dist/maplibre-gl-worker.mjs');
      }
    }

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
            attribution: '&copy; OpenStreetMap',
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
      center: [(destLng + riderLng) / 2, (destLat + riderLat) / 2],
      zoom: 13.5,
    });

    mapRef.current = map;

    map.on('load', () => {
      setIsMapLoaded(true);

      // Customer Destination House Pin
      const destEl = document.createElement('div');
      destEl.className = 'qb-dest-marker';
      destEl.innerHTML = `
        <div style="background-color: #047857; color: white; padding: 6px; border-radius: 9999px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); border: 2px solid white; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        </div>
      `;
      destMarkerRef.current = new maplibregl.Marker({ element: destEl })
        .setLngLat([destLng, destLat])
        .addTo(map);

      // Rider Delivery Motorbike Marker
      const riderEl = document.createElement('div');
      riderEl.className = 'qb-rider-marker';
      riderEl.innerHTML = `
        <div style="background-color: #2563eb; color: white; padding: 6px; border-radius: 9999px; box-shadow: 0 6px 12px -2px rgba(37,99,235,0.4); border: 2.5px solid white; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; transform: scale(1); transition: transform 0.2s ease;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"></circle><circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="15" cy="5" r="1"></circle><path d="M12 17.5V14l-3-3 4-3 2 3h2"></path></svg>
        </div>
      `;
      riderMarkerRef.current = new maplibregl.Marker({ element: riderEl })
        .setLngLat([riderLng, riderLat])
        .addTo(map);

      // Fit bounds to show both points with comfort padding
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([destLng, destLat]);
      bounds.extend([riderLng, riderLat]);
      map.fitBounds(bounds, { padding: 60, maxZoom: 16 });

      fetchRoute();
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [order, fetchRoute]);

  // Update Road Polyline Layer on Map
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || routeCoordinates.length === 0) return;

    const map = mapRef.current;
    const geojsonData: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: routeCoordinates,
      },
    };

    if (map.getSource('route-source')) {
      (map.getSource('route-source') as maplibregl.GeoJSONSource).setData(geojsonData);
    } else {
      map.addSource('route-source', {
        type: 'geojson',
        data: geojsonData,
      });

      map.addLayer({
        id: 'route-line-casing',
        type: 'line',
        source: 'route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#064e3b',
          'line-width': 7,
          'line-opacity': 0.4,
        },
      });

      map.addLayer({
        id: 'route-line-core',
        type: 'line',
        source: 'route-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#10b981',
          'line-width': 4.5,
          'line-opacity': 0.95,
        },
      });
    }
  }, [routeCoordinates, isMapLoaded]);

  // Determine current lifecycle step index
  const currentStepIndex = (() => {
    if (!order) return 0;
    const normalized = order.status.toUpperCase();
    if (normalized === 'PLACED') return 0;
    if (normalized === 'CONFIRMED') return 1;
    if (normalized === 'PACKING') return 1;
    const idx = LIFECYCLE_STEPS.findIndex((s) => s.key === normalized);
    return idx >= 0 ? idx : 0;
  })();

  const isRiderAccepted = currentStepIndex >= 4; // RIDER_ACCEPTED or beyond
  const isOutForDelivery = currentStepIndex >= 4; // Once rider accepts, in transit / out for delivery
  const isDelivered = order?.status === 'DELIVERED' || order?.status === 'delivered';
  const isCancelled = order?.status === 'CANCELLED' || order?.status === 'cancelled';

  if (isLoading) {
    return (
      <div className="p-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-500">Connecting to live delivery tracking...</p>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="p-8 text-center space-y-4 bg-red-50/70 rounded-3xl border border-red-200">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
        <p className="text-sm font-bold text-red-900">{errorMsg || 'Order details unavailable.'}</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  const containerClasses = isModal
    ? 'bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]'
    : 'bg-white w-full rounded-3xl shadow-md border border-slate-200 overflow-hidden space-y-6 p-6';

  return (
    <div className={containerClasses}>
      {/* Tracker Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Bike className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Order</span>
              <span className="text-xs font-mono font-bold text-slate-700">#{order._id.slice(-6)}</span>
              {isDelivered ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  DELIVERED
                </span>
              ) : isCancelled ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                  CANCELLED
                </span>
              ) : isOutForDelivery ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  OUT FOR DELIVERY
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                  STORE PREPARING
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              {isDelivered
                ? 'Delivered to your Doorstep!'
                : isOutForDelivery
                ? 'Out for Delivery — Your Groceries are On the Way!'
                : 'Store is Preparing Your Order'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchOrder}
            title="Refresh order"
            className="p-2 rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-slate-200/60 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Tracking Content */}
      <div className="overflow-y-auto p-6 space-y-6">
        {/* Dynamic Metric Bar during In-Flight Transit */}
        {isOutForDelivery && !isDelivered && (
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-4 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider block">
                  Estimated Arrival Time
                </span>
                <span className="text-xl font-black tracking-tight">
                  {liveEtaMinutes ? `${liveEtaMinutes} Mins` : '10-15 Mins'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-emerald-100">
              {liveDistanceKm !== null && (
                <div>
                  <span className="text-[10px] text-emerald-200/80 block uppercase">Distance</span>
                  <span className="font-bold text-white text-sm">{liveDistanceKm} km away</span>
                </div>
              )}
              <div className="text-right">
                <span className="text-[10px] text-emerald-200/80 block uppercase">GPS Signal</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {lastUpdatedSecAgo < 15 ? 'Live Fix' : `Updated ${lastUpdatedSecAgo}s ago`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Map Section (Active after order acceptance) */}
        {!isCancelled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-700">
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Route Map</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Road Route via OpenStreetMap
              </span>
            </div>

            <div
              ref={mapContainerRef}
              className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 relative"
            />
          </div>
        )}

        {/* Delivery Partner Information Card (STRICT PRIVACY: ONLY EXPOSED AFTER RIDER_ACCEPTED) */}
        {isRiderAccepted && order.deliveryPartner ? (
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                {order.deliveryPartner.name ? order.deliveryPartner.name.charAt(0).toUpperCase() : 'R'}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-slate-900">{order.deliveryPartner.name}</h3>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    <ShieldCheck className="w-3 h-3 text-blue-700" /> Verified Partner
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {order.deliveryPartner.deliveryDetails?.vehicleType || 'Delivery Scooter'}
                  {order.deliveryPartner.deliveryDetails?.vehicleNumber && (
                    <span className="font-mono text-slate-800 font-bold ml-1">
                      ({order.deliveryPartner.deliveryDetails.vehicleNumber})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {order.deliveryPartner.phone && (
              <a
                href={`tel:${order.deliveryPartner.phone}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm transition-colors self-start sm:self-auto cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Delivery Partner</span>
              </a>
            )}
          </div>
        ) : !isCancelled && !isDelivered ? (
          /* Pre-Acceptance Notice (NO fabricated rider details shown) */
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 text-amber-700 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Assigning Nearest Express Rider Partner...</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Your delivery partner profile and direct contact options will appear here as soon as the rider accepts the dispatch.
              </p>
            </div>
          </div>
        ) : null}

        {/* 8-Stage Lifecycle Stepper */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Order Progress</h4>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {LIFECYCLE_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const isUpcoming = idx > currentStepIndex;

              return (
                <div key={step.key} className="relative flex items-start gap-3">
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                      isPast
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/30 animate-pulse'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-3 h-3 stroke-[3]" /> : idx + 1}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <p
                      className={`text-xs font-bold leading-none ${
                        isCurrent ? 'text-blue-700 text-sm' : isPast ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[11px] text-slate-500">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Doorstep Address */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs text-slate-700 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 pb-1 border-b border-slate-200/60">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span>Delivering To: {order.deliveryAddress.receiverName} ({order.deliveryAddress.phone})</span>
          </div>
          <p className="font-semibold text-slate-800">{order.deliveryAddress.house}, {order.deliveryAddress.street}</p>
          {order.deliveryAddress.landmark && (
            <p className="text-slate-500 italic text-[11px]">Landmark: {order.deliveryAddress.landmark}</p>
          )}
        </div>
      </div>
    </div>
  );
};

