'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Sparkles,
  ArrowRight,
  Store,
  IndianRupee,
  Eye,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useFavorites } from '@/context/FavoritesContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Product } from '@/data/mockData';
import { ProductImageModal } from '@/components/home/ProductImageModal';

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { favorites, removeFavorite, clearFavorites } = useFavorites();
  const { items: cartItems, addToCart, updateQuantity } = useCart();
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage((current) => (current === msg ? null : current));
    }, 2500);
  };

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof product.stock === 'number' && product.stock <= 0) return;

    addToCart(product);
    setAddedItemIds((prev) => ({ ...prev, [product.id]: true }));
    showFeedback(`Added "${product.name}" to cart!`);
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  const handleOrderNow = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof product.stock === 'number' && product.stock <= 0) return;

    const inCart = cartItems.find((i) => i.id === product.id);
    if (!inCart) {
      addToCart(product);
    }
    router.push('/buy-now');
  };

  const handleAddAllToCart = () => {
    const availableItems = favorites.filter(
      (p) => typeof p.stock !== 'number' || p.stock > 0
    );
    if (availableItems.length === 0) return;

    availableItems.forEach((product) => {
      addToCart(product);
    });
    showFeedback(`Added ${availableItems.length} items to your cart!`);
  };

  const cartTotalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const cartTotalCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-slate-50/50 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-[#15803d] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">Favorite</span>
        </div>

        {/* Page Header Bar */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-xs shrink-0">
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 fill-rose-500" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    My Favorites
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    {favorites.length} {favorites.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Your hand-picked groceries and everyday essentials. Order them directly in one click!
                </p>
              </div>
            </div>

            {/* Quick Batch Actions */}
            {favorites.length > 0 && (
              <div className="flex items-center gap-2.5 pt-2 md:pt-0">
                <button
                  type="button"
                  onClick={handleAddAllToCart}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#15803d] hover:bg-[#166534] text-white shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add All to Cart</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all favorite items?')) {
                      clearFavorites();
                      showFeedback('Cleared all favorites');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer"
                  title="Clear all favorites"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              </div>
            )}
          </div>

          {/* Feedback Toast Banner */}
          {feedbackMessage && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between animate-in fade-in duration-200">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                {feedbackMessage}
              </span>
              <Link
                href="/cart"
                className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900 inline-flex items-center gap-1"
              >
                View Cart <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Favorites Content Area */}
        {!isAuthenticated ? (
          /* Unauthenticated State */
          <div className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-16 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Heart className="w-10 h-10 fill-rose-500/20" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Sign In to View Your Favorites
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              Please log in to your account or create a new one to access your saved favorite products and easily reorder anytime.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login?redirect=/favorites"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-[#15803d] hover:bg-[#166534] text-white shadow-sm transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </Link>
              <Link
                href="/signup?redirect=/favorites"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-[#15803d] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </Link>
            </div>
          </div>
        ) : favorites.length === 0 ? (
          /* Empty State for Logged In User */
          <div className="bg-white rounded-3xl border border-slate-100 p-8 sm:p-16 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Heart className="w-10 h-10 fill-rose-500/20" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Your Favorite list is empty
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              You haven&apos;t added any items to your favorites yet. Tap the heart icon on any product while browsing our fresh catalog to save it here for quick reordering!
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-[#15803d] hover:bg-[#166534] text-white shadow-sm transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Explore Groceries</span>
              </Link>
              <Link
                href="/cart"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Check Your Cart</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Grid of Favorite Products */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
            {favorites.map((product) => {
              const isOutOfStock =
                typeof product.stock === 'number' && product.stock <= 0;
              const cartItem = cartItems.find((i) => i.id === product.id);
              const inCartQty = cartItem ? cartItem.quantity : 0;
              const isAdded = !!addedItemIds[product.id];

              return (
                <div
                  key={product.id}
                  className="group relative bg-white rounded-2xl sm:rounded-3xl border border-slate-100 p-3 sm:p-4 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-emerald-200 transition-all duration-200"
                >
                  {/* Top Bar: Stock Badge and Heart Unfavorite Button */}
                  <div className="flex items-center justify-between mb-2">
                    {isOutOfStock ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 capitalize">
                        {product.category || 'Grocery'}
                      </span>
                    )}

                    {/* Remove from favorites button */}
                    <button
                      type="button"
                      onClick={() => {
                        removeFavorite(product.id);
                        showFeedback(`Removed "${product.name}" from favorites`);
                      }}
                      className="p-1.5 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Remove from favorites"
                      aria-label="Remove from favorites"
                    >
                      <Heart className="w-4 h-4 fill-rose-500" />
                    </button>
                  </div>

                  {/* Product Image: Click to preview large view */}
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPreviewProduct(product);
                    }}
                    className="relative group/favImg w-full h-28 sm:h-36 rounded-2xl bg-slate-50 flex items-center justify-center p-2 mb-3 overflow-hidden cursor-pointer hover:bg-emerald-50/40 transition-colors"
                    title="Click to view full image"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply group-hover/favImg:scale-106 transition-transform duration-200"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover/favImg:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="p-1 rounded-full bg-white/95 text-slate-800 shadow-sm flex items-center gap-1 text-[10px] font-bold px-1.5">
                        <Eye className="w-3 h-3 text-[#15803d]" />
                        <span>View</span>
                      </span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {product.shopName && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate mb-1">
                          <Store className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{product.shopName}</span>
                        </div>
                      )}

                      <h3
                        title={product.name}
                        className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-[#15803d] transition-colors"
                      >
                        {product.name}
                      </h3>

                      {product.unit && (
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {product.unit}
                        </p>
                      )}
                    </div>

                    {/* Price and Ordering Area */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-baseline gap-1.5 mb-2.5">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900 inline-flex items-center">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {product.price}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-[11px] text-slate-400 line-through inline-flex items-center">
                            <IndianRupee className="w-2.5 h-2.5" />
                            {product.originalPrice}
                          </span>
                        )}
                      </div>

                      {/* Add to Cart / Quantity Stepper & Order Now */}
                      {isOutOfStock ? (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed text-center"
                        >
                          Unavailable
                        </button>
                      ) : inCartQty > 0 ? (
                        <div className="space-y-1.5">
                          {/* Stepper controls */}
                          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-1 text-emerald-800">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, inCartQty - 1)}
                              className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-700 hover:text-red-600 shadow-2xs transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-extrabold px-2">
                              {inCartQty} in cart
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, inCartQty + 1)}
                              className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-700 hover:text-emerald-700 shadow-2xs transition-colors cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick Checkout button */}
                          <button
                            type="button"
                            onClick={(e) => handleOrderNow(product, e)}
                            className="w-full py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer text-center"
                          >
                            Order Now
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {/* Add to Cart button */}
                          <button
                            type="button"
                            onClick={(e) => handleAddToCart(product, e)}
                            className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                              isAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-[#15803d] border border-emerald-200'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Added!</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>Add to Cart</span>
                              </>
                            )}
                          </button>

                          {/* Instant Order Now button */}
                          <button
                            type="button"
                            onClick={(e) => handleOrderNow(product, e)}
                            className="w-full py-1.5 px-2 rounded-xl text-[11px] font-bold text-slate-600 hover:text-emerald-800 hover:bg-slate-100 transition-colors cursor-pointer text-center"
                          >
                            Order Directly →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Sticky Floating Cart Bar if cart has items */}
        {cartTotalCount > 0 && (
          <div className="fixed bottom-20 md:bottom-6 left-4 right-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom duration-300">
            <div className="bg-[#15803d] text-white rounded-2xl p-3.5 shadow-xl flex items-center justify-between border border-emerald-400/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm">
                  {cartTotalCount}
                </div>
                <div>
                  <p className="text-xs text-emerald-100 font-medium">Cart Ready</p>
                  <p className="text-sm font-extrabold flex items-center">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {cartTotalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              <Link
                href="/cart"
                className="inline-flex items-center gap-1.5 bg-white text-[#15803d] hover:bg-emerald-50 px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all"
              >
                <span>View Cart & Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Product Image Preview Lightbox Modal */}
        <ProductImageModal
          product={previewProduct}
          isOpen={!!previewProduct}
          onClose={() => setPreviewProduct(null)}
          onBuyNow={(prod) => handleOrderNow(prod)}
          isFavorite={!!previewProduct}
          onToggleFavorite={(prod) => {
            removeFavorite(prod.id);
            setPreviewProduct(null);
            showFeedback(`Removed "${prod.name}" from favorites`);
          }}
        />

      </div>
    </div>
  );
}

