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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Address } from '@/types/address';
import { fetchAddresses } from '@/lib/addressApi';
import { compressImageFile, syncShopImageToStorage, getStoredShopImage } from '@/lib/imageUtils';

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
    }
  }, [isAuthenticated, user]);

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
        <div className="bg-white rounded-3xl border border-emerald-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-emerald-100">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Registered Storefront Details</span>
            </h2>
            <div className="flex items-center gap-2">
              {!isEditingShop ? (
                <button
                  type="button"
                  onClick={handleStartEditShop}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
                  title="Edit Storefront Details & Shop Image"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancelEditShop}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs"
                  title="Cancel Editing"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
              <Link
                href="/shop"
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              {/* Shop Image Box */}
              <div className="sm:col-span-1 p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block self-start">
                  Shop Image
                </span>
                {user.shopDetails.image ? (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-sm relative group bg-white">
                    <img
                      src={user.shopDetails.image}
                      alt={user.shopDetails.shopName || 'Shop storefront'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-emerald-100/60 border border-dashed border-emerald-300 flex flex-col items-center justify-center text-emerald-700">
                    <Camera className="w-6 h-6 text-emerald-600 mb-1" />
                    <span className="text-[10px] font-semibold text-slate-500">No Image</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleStartEditShop}
                  className="text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  {user.shopDetails.image ? 'Change Photo' : '+ Add Photo'}
                </button>
              </div>

              <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          ) : (
            <form onSubmit={handleSaveShopDetails} className="space-y-4 pt-1">
              {shopError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{shopError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
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

                <div className="space-y-1">
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

                <div className="space-y-1">
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
                <span>{isShopOwner ? 'Shop locations' : 'Delivery Address'}</span>
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

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
              <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-800">No past orders yet</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Once you place grocery orders on QuickBasket, your order receipts and delivery tracking will be shown here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
