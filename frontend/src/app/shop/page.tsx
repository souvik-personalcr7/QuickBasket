'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Tag,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ShopOwnerDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const shopName = user?.shopDetails?.shopName || 'Green Valley Fresh Mart';
  const category = user?.shopDetails?.category || 'Grocery & Staples';
  const address = user?.shopDetails?.address || 'Shop #12, Central Avenue Market';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-radial from-white to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-3 backdrop-blur-xs">
              <Store className="w-3.5 h-3.5" />
              <span>Merchant & Storefront Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Partner'}!
            </h1>
            <p className="mt-1 text-sm text-emerald-100 max-w-xl">
              Managing <strong className="text-white">{shopName}</strong> — Track incoming orders, manage inventory, and update catalog pricing.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-emerald-100">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>{category}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-200">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span>Verified Hyperlocal Seller</span>
              </div>
            </div>
          </div>

          {/* Store Online / Offline Toggle */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col items-center justify-center min-w-[200px]">
            <span className="text-xs font-medium text-emerald-100 mb-2">Store Order Receiving</span>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`w-full py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                isOpen
                  ? 'bg-emerald-400 text-emerald-950 shadow-md'
                  : 'bg-red-500/80 text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-900 animate-ping' : 'bg-white'}`} />
              <span>{isOpen ? 'Store is OPEN' : 'Store is CLOSED'}</span>
            </button>
            <span className="text-[10px] text-emerald-200 mt-1">
              {isOpen ? 'Customers can place orders' : 'Paused new incoming orders'}
            </span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today&apos;s Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">₹14,850</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">+18.4% from yesterday</span>
        </div>

        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Orders</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">6 Orders</p>
          <span className="text-xs text-amber-600 font-semibold mt-1 inline-block">2 ready for rider pickup</span>
        </div>

        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Catalog Products</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">184 Items</p>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">12 items low in stock</span>
        </div>

        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Preparation Time</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">7.2 Mins</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">Excellent packing speed</span>
        </div>
      </div>

      {/* Quick Action Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Overview */}
        <div className="lg:col-span-2 qb-card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Live Incoming Orders</h2>
              <p className="text-xs text-slate-500">Orders placed by neighborhood customers</p>
            </div>
            <button
              type="button"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              View All (28)
            </button>
          </div>

          <div className="space-y-3">
            {[
              { id: 'QB-1092', customer: 'Pooja V.', items: 'Aashirvaad Atta 5kg, Amul Milk 1L, Fresh Bananas', total: '₹480', status: 'Packing', badge: 'qb-badge-amber' },
              { id: 'QB-1091', customer: 'Rohan Mehra', items: 'Fortune Sunlite Oil 1L, Tomatoes 1kg, Onions 2kg', total: '₹340', status: 'Ready for Pickup', badge: 'qb-badge-blue' },
              { id: 'QB-1090', customer: 'Kavita Das', items: 'Britannia Brown Bread, Farm Fresh Eggs (12 pack)', total: '₹195', status: 'Delivered', badge: 'qb-badge-green' },
            ].map((ord) => (
              <div key={ord.id} className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{ord.id}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-700">{ord.customer}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ord.badge}`}>
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{ord.items}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-slate-900">{ord.total}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Store Management Shortcuts */}
        <div className="qb-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 mb-1">Quick Actions</h2>
            <p className="text-xs text-slate-500 mb-4">Merchant shortcuts & catalog tools</p>

            <div className="space-y-2.5">
              <button
                type="button"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span>Add New Product to Store</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                    <Package className="w-4 h-4" />
                  </div>
                  <span>Update Stock & Inventory Counts</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span>Store Profile & Operating Hours</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="mt-6 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>Keep your store inventory updated to avoid order cancellations and maintain high seller ratings.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
