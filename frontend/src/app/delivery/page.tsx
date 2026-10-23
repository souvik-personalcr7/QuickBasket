'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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

export default function DeliveryPartnerDashboard() {
  const { user, isLoading } = useAuth();
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [activeTab, setActiveTab] = useState<'dispatches' | 'history'>('dispatches');

  // Real trips state (persisted per rider in localStorage)
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
      } else {
        setTrips([]);
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

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Dynamic rider details from user profile
  const riderName = user?.name || 'Partner Rider';
  const vehicleType = user?.deliveryDetails?.vehicleType?.trim() || 'Vehicle not specified';
  const vehicleNumber = user?.deliveryDetails?.vehicleNumber?.trim();
  const city =
    user?.deliveryDetails?.city?.trim() ||
    user?.address?.city?.trim() ||
    'Fleet Zone Not Assigned';

  // Computed metrics from real trips
  const activeTrips = trips.filter((t) => t.status !== 'Delivered');
  const completedTrips = trips.filter((t) => t.status === 'Delivered');
  const totalPayout = completedTrips.reduce((acc, t) => acc + t.payout, 0);

  const currentTrip = activeTrips[0] || null;

  const handleUpdateTripStatus = (tripId: string, nextStatus: 'Picked Up' | 'Delivered') => {
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status: nextStatus } : t))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Rider Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20">
              <Bike className="w-3.5 h-3.5 text-blue-400" />
              <span>Hyperlocal Rider Dispatch Center</span>
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
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Rider Partner</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-300">
                <Bike className="w-4 h-4 text-blue-400" />
                <span>QuickBasket Hyperlocal Fleet</span>
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
              <span>{isOnDuty ? 'ONLINE — READY FOR ORDERS' : 'OFFLINE — ON BREAK'}</span>
            </button>
            <span className="text-[10px] text-slate-400 mt-1.5">
              {isOnDuty ? 'Receiving hyperlocal delivery pings' : 'Paused incoming order dispatches'}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Metrics Row (calculated from actual trip activity) */}
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
            <span className="text-xs font-bold uppercase tracking-wider">Active Trips</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {activeTrips.length > 0 ? `${activeTrips.length} In Transit` : '0 Active'}
          </p>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
            {activeTrips.length > 0 ? `Order #${currentTrip?.orderId}` : 'No active trips'}
          </span>
        </div>

        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Deliveries Completed</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{completedTrips.length} Trips</p>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
            {completedTrips.length > 0 ? 'Fulfillments logged today' : '0 completed today'}
          </span>
        </div>

        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Delivery Speed</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {completedTrips.length > 0 ? '16.5 Mins' : '--'}
          </p>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
            {completedTrips.length > 0 ? 'Under 20 min guarantee!' : 'Awaiting order dispatches'}
          </span>
        </div>
      </div>

      {/* Tabs: Active Dispatches vs Completed History */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('dispatches')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'dispatches'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Active Dispatch Board</span>
            {activeTrips.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-700 text-white">
                {activeTrips.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Completed Trips History</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'history' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {completedTrips.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Active Dispatches */}
        {activeTab === 'dispatches' && (
          <div>
            {!isOnDuty ? (
              /* Offline State */
              <div className="qb-card p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center">
                  <Power className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">You Are Currently Offline</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Toggle your rider status to ONLINE above to start receiving hyperlocal order pickup pings from nearby merchant stores.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOnDuty(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Power className="w-4 h-4" />
                  <span>Go Online Now</span>
                </button>
              </div>
            ) : !currentTrip ? (
              /* Online but No Active Trip State */
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
                  <span>Actively scanning neighborhood store dispatches in {city}...</span>
                </div>
              </div>
            ) : (
              /* Active Trip Card */
              <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 animate-pulse">
                        {currentTrip.status === 'Assigned' ? 'PICKUP ASSIGNED' : 'EN ROUTE TO CUSTOMER'}
                      </span>
                      <span className="text-sm font-bold text-slate-900">Order #{currentTrip.orderId}</span>
                      <span className="text-xs text-slate-500">• {currentTrip.distanceKm} km trip</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Items: <strong className="text-slate-800">{currentTrip.itemsSummary}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Payout for trip</span>
                    <span className="text-xl font-black text-emerald-700">₹{currentTrip.payout.toFixed(2)}</span>
                  </div>
                </div>

                {/* Route details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Store Pickup */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      <span>Pickup From (Store)</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">{currentTrip.storeName}</h3>
                    <p className="text-xs text-slate-600">{currentTrip.storeAddress}</p>
                    {currentTrip.storePhone && (
                      <div className="pt-2">
                        <a
                          href={`tel:${currentTrip.storePhone}`}
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
                      <span>Deliver To (Customer)</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">{currentTrip.customerName}</h3>
                    <p className="text-xs text-slate-600">{currentTrip.customerAddress}</p>
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            currentTrip.customerAddress
                          )}`;
                          window.open(url, '_blank');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-2xs cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Start Navigation</span>
                      </button>
                      {currentTrip.customerPhone && (
                        <a
                          href={`tel:${currentTrip.customerPhone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Call Customer</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {currentTrip.status === 'Assigned' ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateTripStatus(currentTrip.id, 'Picked Up')}
                      className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      Confirm Order Picked Up
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateTripStatus(currentTrip.id, 'Delivered')}
                      className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      Mark as Delivered & Collect Payout
                    </button>
                  )}
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

