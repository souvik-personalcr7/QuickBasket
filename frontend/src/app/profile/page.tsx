'use client';

import React, { useEffect, useState } from 'react';
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
  Navigation,
  Edit2,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  Tag,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Address } from '@/types/address';
import { fetchAddresses } from '@/lib/addressApi';
import { compressImageFile, syncShopImageToStorage, getStoredShopImage } from '@/lib/imageUtils';
import { apiClient } from '@/lib/api';
import { TrackOrderModal } from '@/components/orders/TrackOrderModal';
import { ShopImageModal } from '@/components/home/ShopImageModal';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout, role, getRoleRedirectPath, updateUserAddress, updateShopDetails, updateUserProfile } = useAuth();
  const router = useRouter();

  // Client-side authentication guard
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?redirect=/profile');
    }
  }, [isLoading, user, router]);

  const [deliveryAddresses, setDeliveryAddresses] = useState<Address[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Array<{
    _id: string;
    status: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    totalAmount: number;
    createdAt: string;
  }>>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [selectedOrderToTrack, setSelectedOrderToTrack] = useState<string | null>(null);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  // Shop Owner / User Profile edit state
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [isSavingOwner, setIsSavingOwner] = useState(false);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [ownerSuccess, setOwnerSuccess] = useState<string | null>(null);

  const handleStartEditOwner = () => {
    setOwnerName(user?.name || '');
    setOwnerPhone(user?.phone || '');
    setOwnerError(null);
    setOwnerSuccess(null);
    setIsEditingOwner(true);
  };

  const handleCancelEditOwner = () => {
    setIsEditingOwner(false);
    setOwnerError(null);
  };

  const handleSaveOwnerDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerError(null);

    if (!ownerName.trim() || ownerName.trim().length < 2) {
      setOwnerError('Owner full name must be at least 2 characters long');
      return;
    }

    if (!ownerPhone.trim() || ownerPhone.trim().length < 8) {
      setOwnerError('Please enter a valid phone number (at least 8 digits)');
      return;
    }

    setIsSavingOwner(true);

    try {
      const res = await updateUserProfile({
        name: ownerName.trim(),
        phone: ownerPhone.trim(),
      });

      if (res.success) {
        setIsEditingOwner(false);
        setOwnerSuccess('Profile details updated successfully!');
        setTimeout(() => setOwnerSuccess(null), 4000);
      } else {
        setOwnerError(res.message || 'Failed to update profile details');
      }
    } catch (err) {
      setOwnerError(err instanceof Error ? err.message : 'Error updating profile details');
    } finally {
      setIsSavingOwner(false);
    }
  };

  // Primary Delivery Address edit state
  const [isEditingPrimary, setIsEditingPrimary] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isSavingPrimary, setIsSavingPrimary] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Shop Owner Registered Details edit state
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopCategory, setShopCategory] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopImage, setShopImage] = useState('');
  const [isSavingShop, setIsSavingShop] = useState(false);
  const [shopError, setShopError] = useState<string | null>(null);
  const [shopSuccess, setShopSuccess] = useState<string | null>(null);
  const [isShopImageModalOpen, setIsShopImageModalOpen] = useState(false);

  // Registered Storefront Carousel State & Smooth Touch Swipe for Mobile
  const [storeSlideIndex, setStoreSlideIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    if (distance > 40) {
      // Swiped left -> next slide
      setStoreSlideIndex((prev) => (prev < 3 ? prev + 1 : 0));
    } else if (distance < -40) {
      // Swiped right -> prev slide
      setStoreSlideIndex((prev) => (prev > 0 ? prev - 1 : 3));
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses().then((res) => {
        if (res.success && res.addresses) {
          setDeliveryAddresses(res.addresses);
        }
      });

      if (role === 'customer') {
        setIsOrdersLoading(true);
        apiClient<{ orders: any[] }>('/orders')
          .then((res) => {
            if (res.success && res.data?.orders) {
              setCustomerOrders(res.data.orders);
            }
          })
          .catch((err) => console.warn('Could not load customer orders:', err))
          .finally(() => setIsOrdersLoading(false));
      }
    }
  }, [isAuthenticated, user, role]);

  const activeDeliveryAddress =
    deliveryAddresses.find((a) => a.isDefault) || deliveryAddresses[0] || null;

  const handleStartEdit = () => {
    setStreet(user?.address?.street || '');
    setCity(user?.address?.city || '');
    setState(user?.address?.state || '');
    setPostalCode(user?.address?.postalCode || '');
    setEditError(null);
    setEditSuccess(null);
    setIsEditingPrimary(true);
  };

  const handleCancelEdit = () => {
    setIsEditingPrimary(false);
    setEditError(null);
  };

  const handleSavePrimaryAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street.trim()) {
      setEditError('Please enter your street address or house details.');
      return;
    }
    if (!city.trim()) {
      setEditError('Please enter your city.');
      return;
    }
    if (!postalCode.trim()) {
      setEditError('Please enter your postal / PIN code.');
      return;
    }

    setIsSavingPrimary(true);
    setEditError(null);

    const res = await updateUserAddress({
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
    });

    setIsSavingPrimary(false);

    if (res.success) {
      setIsEditingPrimary(false);
      setEditSuccess('Primary delivery address updated successfully!');
      setTimeout(() => setEditSuccess(null), 4000);
    } else {
      setEditError(res.message || 'Failed to update address. Please try again.');
    }
  };

  const handleStartEditShop = () => {
    const curName = user?.shopDetails?.shopName || '';
    setShopName(curName);
    setShopCategory(user?.shopDetails?.category || 'General Store');
    setShopAddress(user?.shopDetails?.address || '');
    const currentImg =
      user?.shopDetails?.image ||
      getStoredShopImage({
        name: curName,
        image: user?.shopDetails?.image,
        ownerEmail: user?.email,
        ownerId: user?.id,
      });
    setShopImage(currentImg && !currentImg.includes('photo-1578916171728-46686eac8d58') ? currentImg : (user?.shopDetails?.image || ''));
    setShopError(null);
    setShopSuccess(null);
    setIsEditingShop(true);
  };

  const handleCancelEditShop = () => {
    setIsEditingShop(false);
    setShopError(null);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setShopError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    try {
      const compressed = await compressImageFile(file, 800, 800, 0.82);
      if (compressed) {
        setShopImage(compressed);
        setShopError(null);
      }
    } catch (err) {
      console.error('Failed to process image file:', err);
      setShopError('Failed to process image file. Please try another.');
    }
  };

  const handleSaveShopDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setShopError('Shop name is required.');
      return;
    }

    setIsSavingShop(true);
    setShopError(null);

    const cleanImg = shopImage.trim();

    // 1. Immediately persist to localStorage across all records
    syncShopImageToStorage({
      shopName: shopName.trim(),
      image: cleanImg,
      category: shopCategory.trim(),
      address: shopAddress.trim(),
      ownerId: user?.id,
      ownerEmail: user?.email,
      isOpen: true,
    });

    // 2. Persist to API
    const res = await updateShopDetails({
      shopName: shopName.trim(),
      category: shopCategory.trim(),
      address: shopAddress.trim(),
      image: cleanImg,
    });

    setIsSavingShop(false);

    if (res.success) {
      setIsEditingShop(false);
      setShopSuccess('Storefront details and shop image updated successfully!');
      setTimeout(() => setShopSuccess(null), 4000);
    } else {
      setIsEditingShop(false);
      setShopSuccess('Storefront details updated locally and published to customer view!');
      setTimeout(() => setShopSuccess(null), 4000);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user is a shop owner or delivery partner, offer direct portal link
  const isMerchantOrRider = role === 'shop_owner' || role === 'delivery_partner';
  const isShopOwner = role === 'shop_owner';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile / Shop Owner Details Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-2 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-3xl bg-emerald-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shrink-0">
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

          <div className="flex items-center gap-2 self-center sm:self-start shrink-0">
            {!isEditingOwner ? (
              <button
                type="button"
                onClick={handleStartEditOwner}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
                title="Edit Details"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelEditOwner}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                title="Cancel Editing"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {ownerSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{ownerSuccess}</span>
          </div>
        )}

        {isEditingOwner && (
          <form onSubmit={handleSaveOwnerDetails} className="space-y-4 pt-2">
            {ownerError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{ownerError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Souvik Das"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-xs text-slate-800 bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-xs text-slate-800 bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Registered Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-500 bg-slate-100 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Primary login credential (read-only)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelEditOwner}
                disabled={isSavingOwner}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingOwner}
                className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60 shadow-xs cursor-pointer"
              >
                {isSavingOwner ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Details</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Role Shortcut if Merchant or Rider */}
      {isMerchantOrRider && (
        <div className="p-3.5 sm:p-5 rounded-3xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {role === 'shop_owner' ? (
              <Store className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700 shrink-0" />
            ) : (
              <Bike className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 whitespace-nowrap overflow-x-auto scrollbar-none">
                Switch to {role === 'shop_owner' ? 'Shop Owner' : 'Delivery Partner'} Workspace
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 truncate sm:whitespace-normal">
                Manage your store catalog, incoming orders, and live dispatch duties.
              </p>
            </div>
          </div>
          <Link
            href={getRoleRedirectPath(role)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-2xs whitespace-nowrap"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Shop Owner Registered Details */}
      {role === 'shop_owner' && user.shopDetails && (
        <div className="bg-white rounded-3xl border border-emerald-200/80 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 sm:gap-3 pb-3 border-b border-emerald-100">
            <h2 className="text-xs xs:text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink min-w-0">
              <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              <span className="whitespace-nowrap">Registered Storefront Details</span>
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {!isEditingShop ? (
                <button
                  type="button"
                  onClick={handleStartEditShop}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs shrink-0 cursor-pointer"
                  title="Edit Storefront Details & Shop Image"
                >
                  <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Edit</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancelEditShop}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs shrink-0 cursor-pointer"
                  title="Cancel Editing"
                >
                  <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
              <Link
                href="/shop"
                className="text-[11px] sm:text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-emerald-200 transition-colors shrink-0"
              >
                Manage Catalog &rarr;
              </Link>
            </div>
          </div>

          {shopSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{shopSuccess}</span>
            </div>
          )}

          {!isEditingShop ? (
            <div>
              {/* Mobile View: Smooth Touch Carousel (< sm) */}
              <div className="block sm:hidden space-y-3">
                {/* Carousel Header Controls */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200">
                      {storeSlideIndex + 1} / 4
                    </span>
                    <span className="text-[11px] font-bold text-slate-700">
                      {storeSlideIndex === 0 && 'Shop Image'}
                      {storeSlideIndex === 1 && 'Shop Name'}
                      {storeSlideIndex === 2 && 'Store Category'}
                      {storeSlideIndex === 3 && 'Store Address'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setStoreSlideIndex((prev) => (prev > 0 ? prev - 1 : 3))}
                      className="w-7 h-7 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 border border-emerald-200 flex items-center justify-center text-emerald-800 transition-all cursor-pointer shadow-2xs"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStoreSlideIndex((prev) => (prev < 3 ? prev + 1 : 0))}
                      className="w-7 h-7 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 border border-emerald-200 flex items-center justify-center text-emerald-800 transition-all cursor-pointer shadow-2xs"
                      aria-label="Next slide"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Carousel Track Viewport */}
                <div className="overflow-hidden rounded-2xl w-full border border-emerald-100 bg-emerald-50/20">
                  <div
                    className="flex transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${storeSlideIndex * 100}%)` }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {/* Slide 1: Shop Image */}
                    <div className="w-full shrink-0 p-3.5 flex flex-col items-center justify-center text-center space-y-2 min-h-[175px]">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block self-start">
                        Shop Image
                      </span>
                      {user.shopDetails?.image ? (
                        <div
                          onClick={() => setIsShopImageModalOpen(true)}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-sm relative group bg-white shrink-0 cursor-pointer"
                          title="Click to view full storefront photo"
                        >
                          <img
                            src={user.shopDetails.image}
                            alt={user.shopDetails.shopName || 'Shop storefront'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[1px]">
                            <Eye className="w-4 h-4 drop-shadow-sm" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-100/60 border border-dashed border-emerald-300 flex flex-col items-center justify-center text-emerald-700 shrink-0">
                          <Camera className="w-6 h-6 text-emerald-600 mb-1" />
                          <span className="text-[10px] font-semibold text-slate-500">No Image</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleStartEditShop}
                        className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        {user.shopDetails?.image ? 'Change Photo' : '+ Add Photo'}
                      </button>
                    </div>

                    {/* Slide 2: Shop Name */}
                    <div className="w-full shrink-0 p-3.5 flex flex-col justify-between space-y-3 min-h-[175px]">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Shop Name</span>
                        </span>
                        <p className="font-extrabold text-slate-900 text-base leading-snug break-words">
                          {user.shopDetails?.shopName || 'Not specified'}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-emerald-100/80 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md inline-block">
                          Verified Store
                        </span>
                        <span className="text-[10px] text-slate-500">Live Catalog</span>
                      </div>
                    </div>

                    {/* Slide 3: Store Category */}
                    <div className="w-full shrink-0 p-3.5 flex flex-col justify-between space-y-3 min-h-[175px]">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Store Category</span>
                        </span>
                        <p className="font-bold text-slate-800 text-base break-words">
                          {user.shopDetails?.category || 'General Store'}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-emerald-100/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Primary Retail Category</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md inline-block">
                          Active
                        </span>
                      </div>
                    </div>

                    {/* Slide 4: Store Address */}
                    <div className="w-full shrink-0 p-3.5 flex flex-col justify-between space-y-3 min-h-[175px]">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Store Address</span>
                        </span>
                        <p className="font-semibold text-slate-800 text-xs leading-relaxed break-words line-clamp-3" title={user.shopDetails?.address}>
                          {user.shopDetails?.address || 'Address not configured'}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-emerald-100/80 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Pickup Location</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pagination Dots */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  {[0, 1, 2, 3].map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setStoreSlideIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        storeSlideIndex === idx
                          ? 'w-7 bg-emerald-600'
                          : 'w-2 bg-emerald-200 hover:bg-emerald-300'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Desktop / Tablet View: 4-Column Single Row (>= sm) */}
              <div className="hidden sm:grid sm:grid-cols-4 gap-3 text-xs">
                {/* 1. Shop Image Box */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex flex-col items-center justify-center text-center space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block self-start">
                    Shop Image
                  </span>
                  {user.shopDetails?.image ? (
                    <div
                      onClick={() => setIsShopImageModalOpen(true)}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-sm relative group bg-white shrink-0 cursor-pointer"
                      title="Click to view full storefront photo"
                    >
                      <img
                        src={user.shopDetails.image}
                        alt={user.shopDetails.shopName || 'Shop storefront'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[1px]">
                        <Eye className="w-4 h-4 drop-shadow-sm" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-100/60 border border-dashed border-emerald-300 flex flex-col items-center justify-center text-emerald-700 shrink-0">
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 mb-1" />
                      <span className="text-[10px] font-semibold text-slate-500">No Image</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleStartEditShop}
                    className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer whitespace-nowrap"
                  >
                    {user.shopDetails?.image ? 'Change Photo' : '+ Add Photo'}
                  </button>
                </div>

                {/* 2. Shop Name */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Store className="w-3 h-3 text-emerald-600" />
                      <span>Shop Name</span>
                    </span>
                    <p className="font-extrabold text-slate-900 text-sm break-words">
                      {user.shopDetails?.shopName || 'Not specified'}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md inline-block w-fit">
                    Verified Store
                  </span>
                </div>

                {/* 3. Store Category */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Tag className="w-3 h-3 text-emerald-600" />
                      <span>Store Category</span>
                    </span>
                    <p className="font-semibold text-slate-800 break-words">
                      {user.shopDetails?.category || 'General Store'}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Catalog Active
                  </span>
                </div>

                {/* 4. Store Address */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>Store Address</span>
                    </span>
                    <p className="font-semibold text-slate-800 break-words line-clamp-3" title={user.shopDetails?.address}>
                      {user.shopDetails?.address || 'Address not configured'}
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Pickup Location</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveShopDetails} className="space-y-4 pt-1">
              {shopError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{shopError}</span>
                </div>
              )}

              <div className="flex flex-row flex-nowrap items-stretch gap-3 overflow-x-auto scrollbar-none pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible">
                <div className="min-w-[180px] sm:min-w-0 space-y-1 shrink-0 sm:shrink">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Shop Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="e.g. Fresh Daily Supermarket"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-xs text-slate-800 bg-white"
                    required
                  />
                </div>

                <div className="min-w-[180px] sm:min-w-0 space-y-1 shrink-0 sm:shrink">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Store Category
                  </label>
                  <input
                    type="text"
                    value={shopCategory}
                    onChange={(e) => setShopCategory(e.target.value)}
                    placeholder="e.g. Fresh Vegetables & Groceries"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-xs text-slate-800 bg-white"
                  />
                </div>

                <div className="min-w-[200px] sm:min-w-0 space-y-1 shrink-0 sm:shrink">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Store Address / Location
                  </label>
                  <input
                    type="text"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    placeholder="e.g. Shop 12, Ground Floor, Central Mall"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-xs text-slate-800 bg-white"
                  />
                </div>
              </div>

              {/* Shop Image Option */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Shop Image</span>
                  </label>
                  {shopImage && (
                    <button
                      type="button"
                      onClick={() => setShopImage('')}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-300 shadow-xs bg-white shrink-0 flex items-center justify-center">
                    {shopImage ? (
                      <img
                        src={shopImage}
                        alt="Shop preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
                        <span className="text-[9px] block">No Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Upload Shop Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-500">or enter image link below:</span>
                    </div>

                    <input
                      type="url"
                      value={shopImage}
                      onChange={(e) => setShopImage(e.target.value)}
                      placeholder="https://images.unsplash.com/... or paste image URL"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-xs text-slate-800 bg-white"
                    />

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-slate-500 font-medium">Sample images:</span>
                      <button
                        type="button"
                        onClick={() => setShopImage('https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=80')}
                        className="text-[10px] text-emerald-700 hover:underline font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200"
                      >
                        Supermarket
                      </button>
                      <button
                        type="button"
                        onClick={() => setShopImage('https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80')}
                        className="text-[10px] text-emerald-700 hover:underline font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200"
                      >
                        Fresh Fruits & Veg
                      </button>
                      <button
                        type="button"
                        onClick={() => setShopImage('https://images.unsplash.com/photo-1526367790999-0150786686a2?w=500&auto=format&fit=crop&q=80')}
                        className="text-[10px] text-emerald-700 hover:underline font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200"
                      >
                        Organic Mart
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={handleCancelEditShop}
                  disabled={isSavingShop}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingShop}
                  className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60 shadow-xs"
                >
                  {isSavingShop ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Store Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Delivery Partner Registered Details */}
      {role === 'delivery_partner' && user.deliveryDetails && (
        <div className="bg-white rounded-3xl border border-emerald-200/80 p-4 sm:p-6 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 border-b border-emerald-100">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2 whitespace-nowrap min-w-0">
              <Bike className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="whitespace-nowrap">Registered Rider & Fleet Details</span>
            </h2>
            <Link
              href="/delivery"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors shrink-0 whitespace-nowrap self-start sm:self-auto"
            >
              <span>Open Dispatch Dashboard</span>
              <span>&rarr;</span>
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
      <div className={`grid grid-cols-1 ${!isMerchantOrRider ? 'md:grid-cols-2' : ''} gap-6`}>
        {/* Saved Addresses */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-slate-100">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-1.5 sm:gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">
                {isShopOwner ? 'Primary Shop Address' : 'Primary Delivery Address'}
              </span>
            </h2>
            {!isEditingPrimary ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-colors shadow-2xs ml-auto"
                title={isShopOwner ? 'Edit Primary Shop Address' : 'Edit Primary Delivery Address'}
              >
                <Edit2 className="w-3 h-3 text-emerald-600" />
                <span>Edit</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs ml-auto"
                title="Cancel Editing"
              >
                <X className="w-3 h-3 text-slate-500" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          {editSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{editSuccess}</span>
            </div>
          )}

          {!isEditingPrimary ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 block text-sm">
                  {isShopOwner ? 'Default Shop Address' : 'Default Home Address'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                  Primary
                </span>
              </div>
              <p className="text-slate-800 font-medium">
                {user.address?.street || (isShopOwner ? 'No store address provided yet.' : 'No street address provided yet.')}
              </p>
              <p className="text-slate-600">
                {user.address?.city ? `${user.address.city}, ` : ''}
                {user.address?.state ? `${user.address.state} ` : ''}
                {user.address?.postalCode || ''}
              </p>
              {!user.address?.street && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="mt-1 text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{isShopOwner ? '+ Set Shop Address' : '+ Set Address'}</span>
                </button>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSavePrimaryAddress}
              className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between pb-1 border-b border-emerald-100">
                <span className="font-bold text-slate-900 text-sm">
                  {isShopOwner ? 'Edit Shop Address' : 'Edit Default Address'}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  {isShopOwner ? 'Store Address' : 'Home Address'}
                </span>
              </div>

              {editError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Street / House / Building <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. Flat 402, Green Valley, MG Road"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-xs text-slate-800 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Kolkata"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-xs text-slate-800 bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. West Bengal"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-xs text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Postal / PIN Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 700001"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-xs text-slate-800 bg-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSavingPrimary}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPrimary}
                  className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60 shadow-xs"
                >
                  {isSavingPrimary ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Address</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Delivery Address / Shop locations (Selected / Detected Location) */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isShopOwner ? 'Shop locations' : 'Delivery Boy Address'}</span>
              </span>
              <Link
                href="/addresses"
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                {activeDeliveryAddress
                  ? 'Manage / Change'
                  : isShopOwner
                  ? '+ Set Shop Location'
                  : '+ Set on Map'}
              </Link>
            </div>

            {activeDeliveryAddress ? (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {activeDeliveryAddress.receiverName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {activeDeliveryAddress.label}
                    </span>
                  </div>
                  {activeDeliveryAddress.phone && (
                    <span className="text-slate-600 font-semibold text-[11px]">
                      {activeDeliveryAddress.phone}
                    </span>
                  )}
                </div>

                <p className="font-medium text-slate-800">
                  {activeDeliveryAddress.house}, {activeDeliveryAddress.street}
                </p>

                {activeDeliveryAddress.landmark && (
                  <p className="text-[11px] text-slate-500 italic">
                    Landmark: {activeDeliveryAddress.landmark}
                  </p>
                )}

                {activeDeliveryAddress.formattedAddress && (
                  <p className="text-[11px] text-emerald-900 font-medium pt-1 border-t border-emerald-200/60 line-clamp-2">
                    📍 {activeDeliveryAddress.formattedAddress}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  {isShopOwner
                    ? 'No shop location set yet. Select your location or pinpoint on the map.'
                    : 'No doorstep delivery address set yet. Select your location or pinpoint on the map.'}
                </p>
                <Link
                  href="/addresses"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0f5132] hover:bg-[#166534] transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {isShopOwner ? 'Use Location / Set Shop Location' : 'Use Location / Add Address'}
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Purchases (Customer Only - Shop Owners & Delivery Partners cannot place customer orders) */}
        {!isMerchantOrRider && (
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

            {isOrdersLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 mt-2">Loading your orders...</p>
              </div>
            ) : customerOrders.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
                <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-800">No past orders yet</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Once you place grocery orders on QuickBasket, your order receipts and delivery tracking will be shown here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {customerOrders.map((ord) => {
                  const isLive =
                    ord.status !== 'DELIVERED' &&
                    ord.status !== 'delivered' &&
                    ord.status !== 'CANCELLED' &&
                    ord.status !== 'cancelled';
                  return (
                    <div
                      key={ord._id}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            Order #{ord._id.slice(-6).toUpperCase()}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              ord.status === 'DELIVERED' || ord.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'CANCELLED' || ord.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}
                          >
                            {ord.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium line-clamp-1">
                          {Array.isArray(ord.items)
                            ? ord.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')
                            : 'Grocery Items'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          &bull; ₹{ord.totalAmount}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderToTrack(ord._id);
                            setIsTrackModalOpen(true);
                          }}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            isLive
                              ? 'bg-[#0f5132] hover:bg-[#166534] text-white shadow-emerald-900/10'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <Bike className="w-3.5 h-3.5" />
                          <span>{isLive ? 'Track Live' : 'View Tracking'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Order Tracking Modal */}
      <TrackOrderModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        orderId={selectedOrderToTrack}
      />

      {/* Storefront Full Image Preview Modal (like ProductImageModal) */}
      {role === 'shop_owner' && user?.shopDetails && (
        <ShopImageModal
          shop={{
            name: user.shopDetails.shopName || shopName || 'My Store',
            image: user.shopDetails.image || shopImage,
            category: user.shopDetails.category || shopCategory,
            address: user.shopDetails.address || shopAddress,
            isOpen: true,
          }}
          isOpen={isShopImageModalOpen}
          onClose={() => setIsShopImageModalOpen(false)}
          isOwner={true}
          onEditImage={handleStartEditShop}
        />
      )}
    </div>
  );
}
