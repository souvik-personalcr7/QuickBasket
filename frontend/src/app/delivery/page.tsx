'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bike,
  Navigation,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Clock,
  Phone,
  Power,
  ShieldCheck,
  Radio,
  PackageCheck,
  AlertCircle,
  Loader2,
  Check,
  RefreshCw,
  Store,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export interface DeliveryTrip {
  id: string;
  orderId: string;
  storeName: string;
  storeAddress: string;
  storePhone?: string;
  customerName: string;
  customerAddress: string;
  customerPhone?: string;
  distanceKm: number;
  payout: number;
  status: 'Assigned' | 'Picked Up' | 'Delivered';
  itemsSummary: string;
  assignedAt: string;
}

export interface LiveBackendOrder {
  _id: string;
  status: string;
  totalAmount: number;
  deliveryFee: number;
  items: Array<{ name: string; quantity: number }>;
  deliveryAddress: {
    receiverName: string;
    phone: string;
    house: string;
    street: string;
    landmark?: string;
    location: { coordinates: [number, number] };
  };
  shop?: {
    name?: string;
    phone?: string;
    shopDetails?: {
      shopName?: string;
      address?: string;
    };
  };
  user?: {
    name?: string;
    phone?: string;
  };
  createdAt: string;
  routeDistanceKm?: number;
}

// Synchronous helper to read persisted duty status immediately on initial page mount/refresh
const getInitialDutyStatus = (): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    // 1. Check general rider duty key
    const gen = localStorage.getItem('qb_rider_online_duty');
    if (gen !== null) {
      return gen === 'true';
    }
    // 2. Fallback to scanning any rider-specific keys in storage
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('qb_rider_online_duty_')) {
        const val = localStorage.getItem(k);
        if (val !== null) return val === 'true';
      }
    }
    return true;
  } catch {
    return true;
  }
};

export default function DeliveryPartnerDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Initialize with synchronous storage read so on refresh it IMMEDIATELY shows offline if turned off
  const [isOnDuty, setIsOnDutyState] = useState<boolean>(getInitialDutyStatus);

  // Load persistent duty status when user profile becomes available
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const riderId = user?.id || (user as any)?._id || (user?.email ? user.email.toLowerCase().trim() : null);

      // 1. Check if rider has explicitly saved duty state on this device
      let localChoice: boolean | null = null;
      if (riderId) {
        const specific = localStorage.getItem(`qb_rider_online_duty_${riderId}`);
        if (specific !== null) {
          localChoice = specific === 'true';
        }
      }
      if (localChoice === null) {
        const gen = localStorage.getItem('qb_rider_online_duty');
        if (gen !== null) {
          localChoice = gen === 'true';
        }
      }

      // If the rider already set their duty status physically, PRESERVE THAT CHOICE!
      if (localChoice !== null) {
        setIsOnDutyState(localChoice);
        // If DB has a different value, sync the rider's physical choice to the DB
        if (user && user.deliveryDetails?.isAvailable !== localChoice) {
          user.deliveryDetails = {
            ...(user.deliveryDetails || {}),
            isAvailable: localChoice,
          };
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          fetch('/api/delivery/duty-status', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ isAvailable: localChoice, userId: user?.id }),
          }).catch(() => {});
        }
        return;
      }

      // If no local setting was ever saved, use remote profile from DB if available
      if (user?.deliveryDetails?.isAvailable !== undefined) {
        setIsOnDutyState(user.deliveryDetails.isAvailable);
        localStorage.setItem('qb_rider_online_duty', String(user.deliveryDetails.isAvailable));
        if (riderId) {
          localStorage.setItem(`qb_rider_online_duty_${riderId}`, String(user.deliveryDetails.isAvailable));
        }
      }
    } catch {
      // Ignored
    }
  }, [user]);

  // Persistent toggle: saves state so it remains OFF through reloads until rider turns it back ON
  const setIsOnDuty = useCallback(
    (newDuty: boolean | ((prev: boolean) => boolean)) => {
      // Calculate target status synchronously without relying on React deferred state updater
      const next = typeof newDuty === 'function' ? newDuty(isOnDuty) : newDuty;

      // 1. Immediately update React state
      setIsOnDutyState(next);

      // 2. Immediately write to localStorage
      if (typeof window !== 'undefined') {
        try {
          // Save to both universal key and user-scoped key
          localStorage.setItem('qb_rider_online_duty', String(next));
          const riderId = user?.id || (user as any)?._id || (user?.email ? user.email.toLowerCase().trim() : null);
          if (riderId) {
            localStorage.setItem(`qb_rider_online_duty_${riderId}`, String(next));
          }
        } catch (e) {
          console.warn('Failed to save rider duty status to localStorage', e);
        }
      }

      // 3. Update in-memory user object so /auth/me doesn't overwrite it
      if (user) {
        if (!user.deliveryDetails) {
          user.deliveryDetails = { isAvailable: next };
        } else {
          user.deliveryDetails.isAvailable = next;
        }
      }

      // 4. Dispatch event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('qb:rider_duty_updated'));
      }

      // 5. Sync duty status to both backend Express and Next.js serverless API
      (async () => {
        try {
          await apiClient('/delivery/duty-status', {
            method: 'PATCH',
            body: JSON.stringify({ isAvailable: next }),
          });
        } catch {
          // Express API may not be running in serverless-only mode; try serverless endpoint
        }

        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          await fetch('/api/delivery/duty-status', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ isAvailable: next, userId: user?.id }),
          });
        } catch (err) {
          console.warn('Failed to sync duty status to Next.js API:', err);
        }
      })();
    },
    [user, isOnDuty]
  );

  // Synchronize cross-tab and storage events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (e: StorageEvent) => {
      if ((e.key === 'qb_rider_online_duty' || e.key?.startsWith('qb_rider_online_duty_')) && e.newValue !== null) {
        setIsOnDutyState(e.newValue === 'true');
      }
    };

    const handleCustom = () => {
      try {
        const riderId = user?.id || (user as any)?._id || (user?.email ? user.email.toLowerCase().trim() : null);
        if (riderId) {
          const specific = localStorage.getItem(`qb_rider_online_duty_${riderId}`);
          if (specific !== null) {
            setIsOnDutyState(specific === 'true');
            return;
          }
        }
        const gen = localStorage.getItem('qb_rider_online_duty');
        if (gen !== null) {
          setIsOnDutyState(gen === 'true');
        }
      } catch {
        // Ignored
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('qb:rider_duty_updated', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('qb:rider_duty_updated', handleCustom);
    };
  }, [user]);

  const [activeTab, setActiveTab] = useState<'dispatches' | 'history'>('dispatches');

  // Client-side RBAC guard
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login?redirect=/delivery');
      } else if (user.role !== 'delivery_partner' && user.role !== 'admin') {
        router.replace(user.role === 'customer' ? '/' : user.role === 'shop_owner' ? '/shop' : '/');
      }
    }
  }, [isLoading, user, router]);

  // Live Dispatches from Backend
  const [liveOrders, setLiveOrders] = useState<LiveBackendOrder[]>([]);
  const [isFetchingOrders, setIsFetchingOrders] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // GPS Tracking State
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'error'>('idle');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);
  const [lastGpsUpdate, setLastGpsUpdate] = useState<Date | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Local Trip History
  const [trips, setTrips] = useState<DeliveryTrip[]>([]);
  const [isTripsLoaded, setIsTripsLoaded] = useState(false);

  const storageKey = useMemo(() => {
    return `qb_rider_trips_${user?.id || user?.email || 'guest'}`;
  }, [user?.id, user?.email]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTrips(parsed);
        }
      }
    } catch {
      setTrips([]);
    } finally {
      setIsTripsLoaded(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (isTripsLoaded) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(trips));
      } catch (err) {
        console.error('Failed to save rider trips:', err);
      }
    }
  }, [trips, storageKey, isTripsLoaded]);

  // Fetch real orders from backend
  const fetchLiveOrders = useCallback(async () => {
    if (!user || (user.role !== 'delivery_partner' && user.role !== 'admin')) return;
    setIsFetchingOrders(true);
    try {
      const res = await apiClient<{ orders: LiveBackendOrder[] }>('/delivery/active-orders');
      if (res.success && res.data?.orders) {
        setLiveOrders(res.data.orders);
      }
    } catch {
      // Ignored
    } finally {
      setIsFetchingOrders(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLiveOrders();

    const socket = getSocket();
    const handleRefresh = () => {
      fetchLiveOrders();
    };

    socket.on('order:status:updated', handleRefresh);
    socket.on('rider:assigned', handleRefresh);
    socket.on('rider:delivery:accepted', handleRefresh);

    // Auto-poll every 4s for instant dispatches
    const interval = setInterval(fetchLiveOrders, 4000);

    return () => {
      socket.off('order:status:updated', handleRefresh);
      socket.off('rider:assigned', handleRefresh);
      socket.off('rider:delivery:accepted', handleRefresh);
      clearInterval(interval);
    };
  }, [fetchLiveOrders]);

  // Active in-flight order being fulfilled
  const activeOrder = useMemo(() => {
    return liveOrders.find((o) =>
      ['OUT_FOR_DELIVERY', 'PICKED_UP', 'RIDER_ACCEPTED'].includes(o.status)
    ) || null;
  }, [liveOrders]);

  // Available dispatch offers waiting for acceptance
  const availableOrders = useMemo(() => {
    return liveOrders.filter((o) =>
      ['SHOP_ACCEPTED', 'FINDING_RIDER', 'RIDER_ASSIGNED', 'ORDER_PLACED', 'confirmed', 'packing'].includes(o.status)
    );
  }, [liveOrders]);

  // Start Real-Time Device GPS Broadcasting
  const startGpsBroadcast = useCallback((targetOrderId: string) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsStatus('error');
      setGpsErrorMsg('Geolocation API is not supported by your mobile browser.');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setGpsStatus('requesting');
    setGpsErrorMsg(null);

    const socket = getSocket();

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading, accuracy } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setGpsAccuracy(Math.round(accuracy));
        setGpsStatus('active');
        setLastGpsUpdate(new Date());

        // Authenticated live stream to backend over Socket.IO
        socket.emit('rider:location:update', {
          orderId: targetOrderId,
          latitude,
          longitude,
          heading: heading || 0,
          accuracy: Math.round(accuracy),
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
          setGpsErrorMsg('GPS permission denied. Please allow location access in your browser settings.');
        } else {
          setGpsStatus('error');
          setGpsErrorMsg(err.message || 'GPS signal unavailable.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 3000,
      }
    );

    watchIdRef.current = id;
  }, []);

  const stopGpsBroadcast = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsStatus('idle');
    setGpsAccuracy(null);
    setGpsCoords(null);
  }, []);

  // Sync GPS with active in-flight order
  useEffect(() => {
    if (activeOrder && isOnDuty) {
      startGpsBroadcast(activeOrder._id);
    } else {
      stopGpsBroadcast();
    }

    return () => {
      stopGpsBroadcast();
    };
  }, [activeOrder, isOnDuty, startGpsBroadcast, stopGpsBroadcast]);

  // Order Actions
  const handleAcceptOrder = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await apiClient<{ order: LiveBackendOrder }>(`/delivery/orders/${orderId}/accept`, {
        method: 'POST',
        body: JSON.stringify({
          latitude: gpsCoords?.lat,
          longitude: gpsCoords?.lng,
        }),
      });

      if (res.success) {
        startGpsBroadcast(orderId);
        await fetchLiveOrders();
      } else {
        alert(res.message || 'Failed to accept order.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error accepting delivery.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateStatus = async (
    orderId: string,
    nextStatus: 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED'
  ) => {
    setActionLoadingId(orderId);
    try {
      const res = await apiClient<{ order: LiveBackendOrder }>(`/delivery/orders/${orderId}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: nextStatus,
          latitude: gpsCoords?.lat,
          longitude: gpsCoords?.lng,
        }),
      });

      if (res.success) {
        if (nextStatus === 'DELIVERED') {
          stopGpsBroadcast();
          // Record into local trip history
          const target = liveOrders.find((o) => o._id === orderId);
          if (target) {
            const completedTrip: DeliveryTrip = {
              id: `trip_${Date.now()}`,
              orderId: target._id.slice(-6),
              storeName: target.shop?.shopDetails?.shopName || 'Neighborhood Store',
              storeAddress: target.shop?.shopDetails?.address || 'Market Area',
              customerName: target.deliveryAddress.receiverName,
              customerAddress: `${target.deliveryAddress.house}, ${target.deliveryAddress.street}`,
              customerPhone: target.deliveryAddress.phone,
              distanceKm: target.routeDistanceKm || 2.4,
              payout: target.deliveryFee || 35,
              status: 'Delivered',
              itemsSummary: target.items.map((i) => `${i.quantity}x ${i.name}`).join(', '),
              assignedAt: 'Today',
            };
            setTrips((prev) => [completedTrip, ...prev]);
          }
        }
        await fetchLiveOrders();
      } else {
        alert(res.message || 'Status update failed.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error updating status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading || !user || (user.role !== 'delivery_partner' && user.role !== 'admin')) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isApproved = true;
  const riderName = user?.name || 'Partner Rider';
  const vehicleType = user?.deliveryDetails?.vehicleType?.trim() || 'Delivery Vehicle';
  const vehicleNumber = user?.deliveryDetails?.vehicleNumber?.trim();
  const city = user?.deliveryDetails?.city?.trim() || user?.address?.city?.trim() || 'Hyperlocal Hub';

  const completedTrips = trips.filter((t) => t.status === 'Delivered');
  const totalPayout = completedTrips.reduce((acc, t) => acc + t.payout, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Rider Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20 whitespace-nowrap shrink-0">
              <Bike className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="whitespace-nowrap">Hyperlocal Rider Dispatch Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {riderName}!
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Operating in <strong className="text-white">{city}</strong> • Vehicle:{' '}
              <span className="text-blue-300 font-semibold">
                {vehicleType}
                {vehicleNumber ? ` (${vehicleNumber})` : ''}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 text-xs text-slate-300">
              <div className="inline-flex items-center gap-1.5 text-emerald-300 whitespace-nowrap shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="whitespace-nowrap">Verified Rider Partner</span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-blue-300 whitespace-nowrap shrink-0">
                <Bike className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="whitespace-nowrap">QuickBasket Hyperlocal Fleet</span>
              </div>
            </div>
          </div>

          {/* On Duty / Off Duty Switch */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex flex-col items-center justify-center min-w-[220px]">
            <span className="text-xs font-medium text-slate-300 mb-2">Rider Availability</span>
            <button
              type="button"
              onClick={() => setIsOnDuty(!isOnDuty)}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isOnDuty
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>
                {isOnDuty
                  ? 'ONLINE — READY FOR ORDERS'
                  : 'OFFLINE — ON BREAK'}
              </span>
            </button>
            <span className="text-[10px] text-slate-400 mt-1.5">
              {isOnDuty
                ? 'Receiving hyperlocal delivery pings'
                : 'Paused incoming order dispatches'}
            </span>
          </div>
        </div>
      </div>

      {/* GPS Status Indicator Bar (When Active Trip is Running) */}
      {activeOrder && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs ${
            gpsStatus === 'active'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : gpsStatus === 'denied'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${
                gpsStatus === 'active'
                  ? 'bg-emerald-500 animate-ping'
                  : gpsStatus === 'denied'
                  ? 'bg-red-500'
                  : 'bg-amber-500 animate-pulse'
              }`}
            />
            <div>
              <span className="font-extrabold text-sm block">
                {gpsStatus === 'active'
                  ? 'Live GPS Broadcasting Active'
                  : gpsStatus === 'denied'
                  ? 'GPS Permission Denied'
                  : 'Acquiring High-Accuracy GPS Fix...'}
              </span>
              <span className="text-[11px] opacity-80">
                {gpsStatus === 'active' && gpsAccuracy
                  ? `Accuracy: ±${gpsAccuracy}m • Streamed over Socket.IO to Customer Tracking Map`
                  : gpsErrorMsg || 'Broadcasting device coordinates to customer live map'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {gpsStatus !== 'active' && (
              <button
                type="button"
                onClick={() => startGpsBroadcast(activeOrder._id)}
                className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors cursor-pointer"
              >
                Enable / Retry GPS
              </button>
            )}
            <button
              type="button"
              onClick={fetchLiveOrders}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white/60"
              title="Refresh dispatches"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today&apos;s Payout</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">₹{totalPayout.toLocaleString()}</p>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
            {totalPayout > 0 ? `${completedTrips.length} deliveries fulfilled` : 'No payouts accrued today'}
          </span>
        </div>

        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Deliveries</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {activeOrder ? '1 In Transit' : '0 Active'}
          </p>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
            {activeOrder ? `Order #${activeOrder._id.slice(-6)}` : 'Waiting for trips'}
          </span>
        </div>

        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0">Completed Trips</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{completedTrips.length} Trips</p>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
            Fulfillments recorded
          </span>
        </div>

        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Speed</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">16.5 Mins</p>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
            Under 20 min guarantee!
          </span>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="space-y-6">
        {/* Segmented Tab Card Container */}
        <div className="qb-card p-1 sm:p-1.5 bg-slate-100/90 border border-slate-200/80 rounded-2xl shadow-2xs max-w-xl">
          <div className="grid grid-cols-2 gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('dispatches')}
              className={`w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap inline-flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                activeTab === 'dispatches'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200/60'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="whitespace-nowrap">
                <span className="hidden sm:inline">Active Dispatch Board</span>
                <span className="sm:hidden">Active Dispatch</span>
              </span>
              {activeOrder && (
                <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-emerald-700 text-white shrink-0 whitespace-nowrap font-extrabold">
                  <span className="sm:hidden">1</span>
                  <span className="hidden sm:inline">1 Active</span>
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap inline-flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200/60'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="whitespace-nowrap">
                <span className="hidden sm:inline">Completed Trips History</span>
                <span className="sm:hidden">Completed Trips</span>
              </span>
              <span
                className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap font-extrabold ${
                  activeTab === 'history' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {completedTrips.length}
              </span>
            </button>
          </div>
        </div>

        {activeTab === 'dispatches' && (
          <div className="space-y-6">
            {!isOnDuty ? (
              <div className="qb-card p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center">
                  <Power className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">You Are Currently Offline</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Toggle your status to ONLINE to receive live delivery dispatch notifications.
                </p>
                <button
                  type="button"
                  onClick={() => setIsOnDuty(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Go Online Now
                </button>
              </div>
            ) : activeOrder ? (
              /* Active In-Transit Trip Card */
              <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-200 animate-pulse">
                        {activeOrder.status === 'RIDER_ACCEPTED'
                          ? 'PICKUP ASSIGNED (HEADING TO STORE)'
                          : activeOrder.status === 'PICKED_UP'
                          ? 'ORDER PICKED UP'
                          : 'OUT FOR DELIVERY (EN ROUTE)'}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        Order #{activeOrder._id.slice(-6)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Items:{' '}
                      <strong className="text-slate-800">
                        {activeOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Payout for delivery</span>
                    <span className="text-xl font-black text-emerald-700">
                      ₹{activeOrder.deliveryFee || 35}
                    </span>
                  </div>
                </div>

                {/* Pickup & Drop Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Store Pickup */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <Store className="w-4 h-4 text-amber-600" />
                      <span>Pickup From Store</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {activeOrder.shop?.shopDetails?.shopName || 'Neighborhood Partner Store'}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {activeOrder.shop?.shopDetails?.address || 'Store Location'}
                    </p>
                    {activeOrder.shop?.phone && (
                      <div className="pt-2">
                        <a
                          href={`tel:${activeOrder.shop.phone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Call Store</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Customer Drop-off */}
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      <Navigation className="w-4 h-4 text-emerald-600" />
                      <span>Deliver To Customer</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {activeOrder.deliveryAddress.receiverName}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {activeOrder.deliveryAddress.house}, {activeOrder.deliveryAddress.street}
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const [lng, lat] = activeOrder.deliveryAddress.location.coordinates;
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                          window.open(url, '_blank');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-2xs cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Navigate in Google Maps</span>
                      </button>
                      <a
                        href={`tel:${activeOrder.deliveryAddress.phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Call Customer</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 overflow-x-auto scrollbar-none">
                  {activeOrder.status === 'RIDER_ACCEPTED' ? (
                    <button
                      type="button"
                      disabled={actionLoadingId === activeOrder._id}
                      onClick={() => handleUpdateStatus(activeOrder._id, 'PICKED_UP')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-4 sm:px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      {actionLoadingId === activeOrder._id ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <PackageCheck className="w-4 h-4 shrink-0" />
                      )}
                      <span className="whitespace-nowrap">Order Picked (Confirm Pickup from Store)</span>
                    </button>
                  ) : activeOrder.status === 'PICKED_UP' ? (
                    <button
                      type="button"
                      disabled={actionLoadingId === activeOrder._id}
                      onClick={() => handleUpdateStatus(activeOrder._id, 'OUT_FOR_DELIVERY')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-4 sm:px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      {actionLoadingId === activeOrder._id ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <Navigation className="w-4 h-4 shrink-0" />
                      )}
                      <span className="whitespace-nowrap">Start Doorstep Delivery (Out for Delivery)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoadingId === activeOrder._id}
                      onClick={() => handleUpdateStatus(activeOrder._id, 'DELIVERED')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-4 sm:px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      {actionLoadingId === activeOrder._id ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      )}
                      <span className="whitespace-nowrap">Mark as Delivered &amp; Collect Payout (₹{activeOrder.deliveryFee || 35})</span>
                    </button>
                  )}
                </div>
              </div>
            ) : availableOrders.length > 0 ? (
              /* Available Dispatch Requests List */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span>Incoming Delivery Requests ({availableOrders.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={fetchLiveOrders}
                    className="text-xs text-emerald-700 font-semibold hover:underline"
                  >
                    Refresh
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableOrders.map((ord) => (
                    <div
                      key={ord._id}
                      className="qb-card p-5 space-y-4 border-emerald-300 hover:border-emerald-500 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          Order #{ord._id.slice(-6)}
                        </span>
                        <span className="text-sm font-black text-emerald-700">
                          +₹{ord.deliveryFee || 35} Payout
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p>
                          <strong>Store:</strong> {ord.shop?.shopDetails?.shopName || 'Partner Store'}
                        </p>
                        <p>
                          <strong>Deliver to:</strong> {ord.deliveryAddress.house}, {ord.deliveryAddress.street}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Items: {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={actionLoadingId === ord._id}
                        onClick={() => handleAcceptOrder(ord._id)}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
                      >
                        {actionLoadingId === ord._id ? (
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        ) : (
                          <Bike className="w-4 h-4 shrink-0" />
                        )}
                        <span className="whitespace-nowrap">Accept Delivery Request & Start GPS</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Online but waiting */
              <div className="qb-card p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Bike className="w-8 h-8" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-ping" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Waiting for Delivery Requests</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    You are online in <strong className="text-slate-700">{city}</strong>. When a neighborhood store confirms and packs an order, the pickup request will appear here with instant routing.
                  </p>
                </div>
                <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200/60 text-blue-900 text-xs flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
                  <span>Scanning neighborhood store dispatches in {city}...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Completed Trips History */}
        {activeTab === 'history' && (
          <div>
            {completedTrips.length === 0 ? (
              <div className="qb-card p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <PackageCheck className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">No Trips Completed Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Completed order deliveries and accrued earnings receipts will be permanently recorded here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="qb-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Order #{trip.orderId}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">{trip.customerName}</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                          Delivered
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1 line-clamp-1">
                        From {trip.storeName} &rarr; {trip.customerAddress}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-[11px]">{trip.assignedAt}</span>
                      <span className="text-sm font-extrabold text-emerald-700">+₹{trip.payout.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
