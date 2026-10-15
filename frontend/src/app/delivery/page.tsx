'use client';

import React, { useState } from 'react';
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
  Award,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DeliveryPartnerDashboard() {
  const { user, isLoading } = useAuth();
  const [isOnDuty, setIsOnDuty] = useState(true);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const vehicleType = user?.deliveryDetails?.vehicleType || 'Motorcycle / Scooter';
  const vehicleNumber = user?.deliveryDetails?.vehicleNumber || 'DL 05 EV 4321';
  const city = user?.deliveryDetails?.city || 'South Delhi Fleet';

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
              Hello, {user?.name || 'Rider Hero'}!
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Operating in <strong className="text-white">{city}</strong> • Vehicle:{' '}
              <span className="text-blue-300 font-semibold">{vehicleType} ({vehicleNumber})</span>
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Rider Profile</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-300">
                <Award className="w-4 h-4" />
                <span>Top Rated Hero (4.9 ★)</span>
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today&apos;s Payout</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">₹1,840</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">14 deliveries completed</span>
        </div>

        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Trip</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{isOnDuty ? '1 In Progress' : '0'}</p>
          <span className="text-xs text-blue-600 font-semibold mt-1 inline-block">Order #QB-8924</span>
        </div>

        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Delivery Time</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">14.8 Mins</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">Under 20 min guarantee!</span>
        </div>

        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Acceptance Rate</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">98.5%</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">Eligible for weekly bonus</span>
        </div>
      </div>

      {/* Active Order Dispatch Card */}
      {isOnDuty && (
        <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 animate-pulse">
                  ACTIVE TRIP
                </span>
                <span className="text-sm font-bold text-slate-900">Order #QB-8924</span>
                <span className="text-xs text-slate-500">• Grocery Express</span>
              </div>
              <p className="text-xs text-slate-600">Estimated Delivery Time: <strong>12 Mins remaining</strong></p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Payout for trip</span>
                <span className="text-lg font-black text-emerald-700">₹95.00</span>
              </div>
            </div>
          </div>

          {/* Route details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>Pickup From (Store)</span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Green Fresh Mart & Organic</h3>
              <p className="text-xs text-slate-600">Shop #12, Central Avenue Market, Sector 4</p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call Store</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <Navigation className="w-4 h-4 text-emerald-600" />
                <span>Deliver To (Customer)</span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Aarav Malhotra</h3>
              <p className="text-xs text-slate-600">Flat 302, Tower B, Palm Meadows, 1.8 km away</p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-2xs"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Start GPS Navigation</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call Customer</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              Mark Order as Picked Up
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
