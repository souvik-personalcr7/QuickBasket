'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { LiveOrderTracker } from './LiveOrderTracker';
import { Package, X, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string | null;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  isOpen,
  onClose,
  orderId: initialOrderId,
}) => {
  const [orderId, setOrderId] = useState<string | null>(initialOrderId || null);
  const [isLoading, setIsLoading] = useState(false);
  const [noActiveOrder, setNoActiveOrder] = useState(false);

  useEffect(() => {
    if (initialOrderId) {
      setOrderId(initialOrderId);
      setNoActiveOrder(false);
    } else if (isOpen) {
      // Find latest active customer order
      setIsLoading(true);
      apiClient<{ orders: Array<{ _id: string; status: string }> }>('/orders')
        .then((res) => {
          if (res.success && res.data?.orders && res.data.orders.length > 0) {
            // Find first in-flight order
            const active = res.data.orders.find(
              (o) => o.status !== 'DELIVERED' && o.status !== 'delivered' && o.status !== 'CANCELLED' && o.status !== 'cancelled'
            );
            if (active) {
              setOrderId(active._id);
              setNoActiveOrder(false);
            } else {
              // If none in flight, show most recent order
              setOrderId(res.data.orders[0]._id);
              setNoActiveOrder(false);
            }
          } else {
            setNoActiveOrder(true);
          }
        })
        .catch(() => setNoActiveOrder(true))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, initialOrderId]);

  // Lock background body scroll when track order popup is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-4xl">
        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto shadow-2xl space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Locating your active order...</p>
          </div>
        ) : noActiveOrder || !orderId ? (
          <div className="bg-white rounded-3xl p-8 sm:p-10 text-center max-w-md mx-auto shadow-2xl space-y-4 border border-slate-200 relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <Package className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">No Active Orders Right Now</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                You don&apos;t have any live deliveries in transit. Add fresh groceries to your cart and place an order to track live!
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f5132] hover:bg-[#166534] text-white text-xs font-bold shadow-sm transition-colors"
              >
                <span>Browse Grocery Categories</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <LiveOrderTracker orderId={orderId} onClose={onClose} isModal />
        )}
      </div>
    </div>
  );
};

