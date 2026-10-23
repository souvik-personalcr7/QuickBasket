'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  LogOut,
  ShieldCheck,
  Store,
  Bike,
  PackageCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout, role, getRoleRedirectPath } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user is a shop owner or delivery partner, offer direct portal link
  const isMerchantOrRider = role === 'shop_owner' || role === 'delivery_partner';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-3xl bg-emerald-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl font-black text-slate-900">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                {user.role.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500">QuickBasket verified member since October 2026</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.phone}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Role Shortcut if Merchant or Rider */}
      {isMerchantOrRider && (
        <div className="p-5 rounded-3xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {role === 'shop_owner' ? (
              <Store className="w-6 h-6 text-emerald-700" />
            ) : (
              <Bike className="w-6 h-6 text-emerald-700" />
            )}
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Switch to {role === 'shop_owner' ? 'Shop Owner' : 'Delivery Partner'} Workspace
              </h2>
              <p className="text-xs text-slate-600">
                Manage your store catalog, incoming orders, and live dispatch duties.
              </p>
            </div>
          </div>
          <Link
            href={getRoleRedirectPath(role)}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Shop Owner Registered Details */}
      {role === 'shop_owner' && user.shopDetails && (
        <div className="bg-white rounded-3xl border border-emerald-200/80 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Registered Storefront Details</span>
            </h2>
            <Link
              href="/shop"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
            >
              Manage Catalog & Orders &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Shop Name</span>
              <p className="font-extrabold text-slate-900 text-sm">{user.shopDetails.shopName || 'Not specified'}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Store Category</span>
              <p className="font-semibold text-slate-800">{user.shopDetails.category || 'General Store'}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Store Address</span>
              <p className="font-semibold text-slate-800">{user.shopDetails.address || 'Address not configured'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Partner Registered Details */}
      {role === 'delivery_partner' && user.deliveryDetails && (
        <div className="bg-white rounded-3xl border border-emerald-200/80 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Bike className="w-4 h-4 text-emerald-600" />
              <span>Registered Rider & Fleet Details</span>
            </h2>
            <Link
              href="/delivery"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
            >
              Open Dispatch Dashboard &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Vehicle Type</span>
              <p className="font-extrabold text-slate-900 text-sm">{user.deliveryDetails.vehicleType || 'Not specified'}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Vehicle Plate Number</span>
              <p className="font-semibold text-slate-800">{user.deliveryDetails.vehicleNumber || 'Not registered'}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Fleet City / Zone</span>
              <p className="font-semibold text-slate-800">{user.deliveryDetails.city || 'Zone not assigned'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Addresses and Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saved Addresses */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Primary Delivery Address</span>
            </h2>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs text-slate-700">
            <span className="font-bold text-slate-900 block text-sm">Default Home Address</span>
            <p>{user.address?.street || 'No street address provided yet.'}</p>
            <p>
              {user.address?.city ? `${user.address.city}, ` : ''}
              {user.address?.postalCode || ''}
            </p>
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span>Recent Orders</span>
            </h2>
            <Link href="/" className="text-xs font-bold text-emerald-700 hover:underline">
              Order More
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-800">No past orders yet</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Once you place grocery orders on QuickBasket, your order receipts and delivery tracking will be shown here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
