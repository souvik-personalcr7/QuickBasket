'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Plus,
  Home,
  Briefcase,
  CheckCircle,
  Trash2,
  Edit2,
  Star,
  ArrowLeft,
  Navigation,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Store,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Address, AddressLabel } from '@/types/address';
import {
  fetchAddresses,
  deleteAddress,
  setDefaultAddress,
} from '@/lib/addressApi';
import { AddressFormModal } from '@/components/location/AddressFormModal';

export default function AddressesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, role } = useAuth();
  const isShopOwner = role === 'shop_owner';

  // Client-side authentication guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/addresses');
    }
  }, [authLoading, user, router]);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const loadAddresses = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchAddresses();
      if (res.success) {
        setAddresses(res.addresses);
      } else {
        setErrorMsg(res.message || 'Unable to load addresses');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to retrieve addresses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [isAuthenticated]);

  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        isShopOwner
          ? 'Are you sure you want to delete this shop location?'
          : 'Are you sure you want to delete this delivery address?'
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await deleteAddress(id);
      if (res.success) {
        setAddresses((prev) => {
          const filtered = prev.filter((a) => a._id !== id);
          if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
            filtered[0].isDefault = true;
          }
          return filtered;
        });
      } else {
        alert(res.message || 'Could not delete address');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error deleting address');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    try {
      const res = await setDefaultAddress(id);
      if (res.success) {
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            isDefault: a._id === id,
          }))
        );
      } else {
        alert(res.message || 'Could not set default address');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error setting default address');
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleSaved = (saved: Address) => {
    loadAddresses();
  };

  const getLabelBadge = (label: AddressLabel) => {
    switch (label) {
      case 'Home':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Home className="w-3 h-3 text-emerald-700" /> Home
          </span>
        );
      case 'Work':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Briefcase className="w-3 h-3 text-blue-700" /> Work
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <MapPin className="w-3 h-3 text-purple-700" /> Other
          </span>
        );
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-emerald-700 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/profile" className="hover:text-emerald-700 transition-colors">
              Account
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">
              {isShopOwner ? 'Shop Locations' : 'Delivery Addresses'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              {isShopOwner ? (
                <Store className="w-5 h-5 text-emerald-700" />
              ) : (
                <MapPin className="w-5 h-5 text-emerald-700" />
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isShopOwner ? 'My Shop Locations' : 'My Delivery Addresses'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isShopOwner
                  ? 'Manage your registered storefront and pickup locations on the map'
                  : 'Manage your saved home, work, and grocery doorstep locations'}
              </p>
            </div>
          </div>
        </div>

        {/* Add New Address Button */}
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-[#0f5132] hover:bg-[#166534] active:bg-[#14532d] shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isShopOwner ? 'Add Shop Location' : 'Add New Address'}</span>
        </button>
      </div>

      {/* Guest Notice if Not Authenticated */}
      {!authLoading && !isAuthenticated && (
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>
              You are browsing in guest mode. <strong>Sign in</strong> to sync your delivery addresses across all your devices and keep them forever.
            </span>
          </div>
          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 self-start sm:self-auto shrink-0 transition-colors"
          >
            Sign In Now
          </Link>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">
            {isShopOwner ? 'Loading your saved shop locations...' : 'Loading your saved delivery addresses...'}
          </p>
        </div>
      ) : addresses.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-md mx-auto shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
            <Navigation className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              {isShopOwner ? 'No Shop Locations Saved Yet' : 'No Saved Addresses Yet'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {isShopOwner
                ? 'Pinpoint your store location on the interactive map so nearby shoppers and delivery riders can locate your shop.'
                : 'Add your current location or pinpoint your doorstep on the interactive map for fast 15-30 minute grocery deliveries.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isShopOwner ? 'Set Your Store Location' : 'Add Your First Address'}</span>
          </button>
        </div>
      ) : (
        /* Saved Addresses Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => {
            const isDefault = !!addr.isDefault;
            const [lng, lat] = addr.location?.coordinates || [0, 0];

            return (
              <div
                key={addr._id}
                className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all relative ${
                  isDefault
                    ? 'border-emerald-500/80 ring-2 ring-emerald-500/10'
                    : 'border-slate-200/90 hover:border-emerald-300'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {isShopOwner ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Store className="w-3 h-3 text-emerald-700" /> Shop Location
                        </span>
                      ) : (
                        getLabelBadge(addr.label)
                      )}
                      {isDefault && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {isShopOwner ? 'Primary Shop Location' : 'Default Address'}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {lat.toFixed(4)}, {lng.toFixed(4)}
                    </span>
                  </div>

                  {/* Receiver & Contact / Shop Info */}
                  <div className="space-y-1 mb-2.5">
                    {isShopOwner ? (
                      <>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>{addr.shopName || user?.shopDetails?.shopName || 'Registered Shop'}</span>
                        </h3>
                        <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Owner: {addr.receiverName}</span>
                          <span className="text-slate-300">•</span>
                          <span>{addr.phone}</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          {addr.receiverName}
                        </h3>
                        <p className="text-xs font-semibold text-slate-600">{addr.phone}</p>
                      </>
                    )}
                  </div>

                  {/* Detailed Doorstep Address */}
                  <div className="text-xs text-slate-700 space-y-0.5 leading-relaxed bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                    <p className="font-semibold text-slate-900">{addr.house}</p>
                    <p className="text-slate-600">{addr.street}</p>
                    {addr.landmark && (
                      <p className="text-slate-500 text-[11px] italic">
                        Landmark: {addr.landmark}
                      </p>
                    )}
                    {addr.formattedAddress && (
                      <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 line-clamp-2">
                        {addr.formattedAddress}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    {!isDefault ? (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr._id)}
                        disabled={settingDefaultId === addr._id}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer disabled:opacity-50"
                      >
                        {settingDefaultId === addr._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        <span>Set as Default</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Active Default
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(addr)}
                      className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                      title="Edit this address"
                      aria-label="Edit address"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(addr._id)}
                      disabled={deletingId === addr._id}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete this address"
                      aria-label="Delete address"
                    >
                      {deletingId === addr._id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Address Form & Map Modal */}
      <AddressFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialAddress={editingAddress}
        onSaved={handleSaved}
        defaultReceiverName={user?.name || ''}
        defaultPhone={user?.phone || ''}
        defaultShopName={user?.shopDetails?.shopName || ''}
        isShopOwner={isShopOwner}
      />
    </div>
  );
}

