'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Home,
  Briefcase,
  Navigation,
  Check,
  Loader2,
  AlertCircle,
  Building,
  User,
  Phone,
} from 'lucide-react';
import { Address, AddressFormData, AddressLabel } from '@/types/address';
import { createAddress, updateAddress } from '@/lib/addressApi';
import { LocationPickerMap } from './LocationPickerMap';

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAddress?: Address | null;
  onSaved: (address: Address) => void;
  defaultReceiverName?: string;
  defaultPhone?: string;
  isShopOwner?: boolean;
}

export const AddressFormModal: React.FC<AddressFormModalProps> = ({
  isOpen,
  onClose,
  initialAddress,
  onSaved,
  defaultReceiverName = '',
  defaultPhone = '',
  isShopOwner = false,
}) => {
  const isEditing = !!initialAddress?._id;

  const [receiverName, setReceiverName] = useState('');
  const [phone, setPhone] = useState('');
  const [house, setHouse] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [label, setLabel] = useState<AddressLabel>('Home');
  const [isDefault, setIsDefault] = useState(false);
  const [latitude, setLatitude] = useState(28.6139);
  const [longitude, setLongitude] = useState(77.209);
  const [formattedAddress, setFormattedAddress] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when modal opens or initialAddress changes
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (initialAddress) {
        setReceiverName(initialAddress.receiverName || '');
        setPhone(initialAddress.phone || '');
        setHouse(initialAddress.house || '');
        setStreet(initialAddress.street || '');
        setLandmark(initialAddress.landmark || '');
        setLabel(initialAddress.label || 'Home');
        setIsDefault(!!initialAddress.isDefault);
        const [lng, lat] = initialAddress.location?.coordinates || [77.209, 28.6139];
        setLongitude(lng);
        setLatitude(lat);
        setFormattedAddress(initialAddress.formattedAddress || '');
      } else {
        setReceiverName(defaultReceiverName);
        setPhone(defaultPhone);
        setHouse('');
        setStreet('');
        setLandmark('');
        setLabel('Home');
        setIsDefault(false);
        setLatitude(28.6139);
        setLongitude(77.209);
        setFormattedAddress('');
      }
    }
  }, [isOpen, initialAddress, defaultReceiverName, defaultPhone]);

  if (!isOpen) return null;

  const handleMapLocationChange = (coords: {
    lat: number;
    lng: number;
    formattedAddress?: string;
    streetSuggestion?: string;
  }) => {
    setLatitude(coords.lat);
    setLongitude(coords.lng);
    if (coords.formattedAddress) {
      setFormattedAddress(coords.formattedAddress);
    }
    // Only auto-fill street if user hasn't typed their own yet
    if (coords.streetSuggestion && !street) {
      setStreet(coords.streetSuggestion);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!receiverName.trim()) {
      setErrorMsg('Please enter the receiver name');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMsg('Please enter a valid phone number (at least 8 digits)');
      return;
    }
    if (!house.trim()) {
      setErrorMsg('Please enter House / Flat / Building / Floor');
      return;
    }
    if (!street.trim()) {
      setErrorMsg('Please enter Street / Area / Locality');
      return;
    }

    setIsSubmitting(true);

    const payload: AddressFormData = {
      receiverName: receiverName.trim(),
      phone: phone.trim(),
      house: house.trim(),
      street: street.trim(),
      landmark: landmark.trim(),
      label,
      latitude,
      longitude,
      formattedAddress: formattedAddress.trim(),
      isDefault,
    };

    try {
      if (isEditing && initialAddress) {
        const res = await updateAddress(initialAddress._id, payload);
        if (res.success && res.address) {
          onSaved(res.address);
          onClose();
        } else {
          setErrorMsg(res.message || 'Failed to update address');
        }
      } else {
        const res = await createAddress(payload);
        if (res.success && res.address) {
          onSaved(res.address);
          onClose();
        } else {
          setErrorMsg(res.message || 'Failed to save address');
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                {isEditing
                  ? (isShopOwner ? 'Edit Shop Location' : 'Edit Delivery Address')
                  : (isShopOwner ? 'Add Shop Location' : 'Add New Delivery Address')}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isShopOwner
                  ? 'Pinpoint your store location on the map and add shop details'
                  : 'Pinpoint your location on the map and add doorstep delivery details'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Interactive Location Picker Map */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isShopOwner ? '1. Select Shop Location on Map' : '1. Select Delivery Location on Map'}</span>
              </label>
              <span className="text-[11px] text-slate-400">
                GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </span>
            </div>

            <LocationPickerMap
              latitude={latitude}
              longitude={longitude}
              onChangeLocation={handleMapLocationChange}
              className="h-64 sm:h-72 w-full rounded-2xl"
            />

            {formattedAddress && (
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900 flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed text-[11px]">
                  <strong>Detected Location:</strong> {formattedAddress}
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Address Details Form */}
          <form id="address-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                {isShopOwner ? '2. Complete Shop Location Details' : '2. Complete Doorstep Delivery Address'}
              </h3>

              {/* Label Chips: Home / Work / Other */}
              <div className="mb-4">
                <span className="block text-xs font-medium text-slate-600 mb-1.5">
                  Save Address As
                </span>
                <div className="flex items-center gap-2">
                  {(['Home', 'Work', 'Other'] as AddressLabel[]).map((lbl) => {
                    const isSelected = label === lbl;
                    const Icon = lbl === 'Home' ? Home : lbl === 'Work' ? Briefcase : MapPin;
                    return (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setLabel(lbl)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#15803d] text-white shadow-sm ring-2 ring-emerald-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{lbl}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid: Receiver Name & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Receiver Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Contact Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* House / Flat / Building */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Flat / House No. / Building / Floor <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={house}
                    onChange={(e) => setHouse(e.target.value)}
                    placeholder="e.g. Flat 402, Lotus Residency, 4th Floor"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Street / Area / Locality */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Street / Area / Locality <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. 5th Main, Sector 4, Indiranagar"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Landmark (Optional) */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nearby Landmark <span className="text-slate-400 text-[11px]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite City Hospital or Near Green Park Metro"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Set as Default Address Checkbox */}
              <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">
                  {isShopOwner ? 'Set as my primary shop location' : 'Set as my default delivery address'}
                </span>
              </label>
            </div>
          </form>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="address-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0f5132] hover:bg-[#166534] active:bg-[#14532d] shadow-sm transition-all cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isShopOwner ? 'Saving Shop Location...' : 'Saving Address...'}</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>
                  {isEditing
                    ? 'Save Changes'
                    : isShopOwner
                    ? 'Save Shop Location'
                    : 'Save Delivery Address'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

