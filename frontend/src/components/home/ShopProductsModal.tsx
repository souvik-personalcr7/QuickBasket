'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Store,
  Star,
  Bike,
  Search,
  Package,
  MapPin,
  Clock,
  Sparkles,
  ShoppingBag,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { Shop, Product } from '@/data/mockData';
import { ProductCard } from './ProductCard';
import { getStoredShopImage } from '@/lib/imageUtils';
import { ShopImageModal } from './ShopImageModal';

interface ShopProductsModalProps {
  shop: Shop | null;
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export const ShopProductsModal: React.FC<ShopProductsModalProps> = ({
  shop,
  products,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isShopImageModalOpen, setIsShopImageModalOpen] = useState(false);

  // Lock background scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Derive unique categories from this shop's products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.unit && p.unit.toLowerCase().includes(q));
      const matchesCategory =
        selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const activeShopImage = useMemo(() => {
    if (!shop) return '';
    return getStoredShopImage(shop);
  }, [shop]);

  if (!isOpen || !shop) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header: Store Banner & Details */}
        <div className="relative bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 text-white p-5 sm:p-6 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div
                onClick={() => setIsShopImageModalOpen(true)}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white/10 border-2 border-white/20 shrink-0 shadow-md cursor-pointer relative group/thumb"
                title="Click to view storefront photo"
              >
                <img
                  src={activeShopImage}
                  alt={shop.name}
                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[1px]">
                  <Eye className="w-4 h-4 drop-shadow-sm" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold mb-1 backdrop-blur-xs">
                  <Store className="w-3 h-3" />
                  <span>Verified Neighborhood Store</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black tracking-tight truncate">
                  {shop.name}
                </h2>
                <p className="text-xs text-emerald-100 flex items-center gap-2 mt-0.5 truncate">
                  <span>{shop.category}</span>
                  {shop.address && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 truncate text-emerald-200">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {shop.address}
                      </span>
                    </>
                  )}
                </p>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs">
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-lg font-bold">
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                    {shop.rating} ({shop.reviewCount})
                  </span>

                  {shop.deliveryTime && (
                    <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-lg font-medium text-emerald-50">
                      <Clock className="w-3 h-3" />
                      {shop.deliveryTime}
                    </span>
                  )}

                  {shop.isFreeDelivery && (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/40 text-emerald-100 px-2 py-0.5 rounded-lg font-semibold">
                      <Bike className="w-3 h-3" />
                      Free Delivery
                    </span>
                  )}

                  <span className="whitespace-nowrap shrink-0 inline-flex items-center gap-1 bg-emerald-900/60 text-emerald-200 px-2.5 py-0.5 rounded-lg font-bold text-[11px]">
                    <Package className="w-3.5 h-3.5 shrink-0" />
                    <span>{products.length}</span>
                    <span>{products.length === 1 ? 'item' : 'items'}</span>
                  </span>

                  {shop.isOpen === false ? (
                    <span className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 bg-red-600/90 text-white px-2.5 py-0.5 rounded-lg font-bold text-[11px] shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span>Closed</span>
                    </span>
                  ) : (
                    <span className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 bg-emerald-500/50 text-white px-2.5 py-0.5 rounded-lg font-bold text-[11px] border border-emerald-400/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      <span>Open Now</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
              aria-label="Close store modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search within this store */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search products in ${shop.name}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-800">{filteredProducts.length}</strong> items from this shop owner
            </div>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products Scrollable Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-[300px]">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center">
                <Package className="w-7 h-7" />
              </div>
              {searchQuery && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Not available right now
                </div>
              )}
              <h3 className="text-base font-extrabold text-slate-900">
                {products.length === 0
                  ? 'No Products Added Yet'
                  : searchQuery
                  ? `"${searchQuery}" is not available right now`
                  : 'No Matching Products'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {products.length === 0
                  ? `The owner of ${shop.name} hasn't added any products to their store catalog yet. When they list products, they will automatically appear here!`
                  : searchQuery
                  ? `This item is currently not available in ${shop.name}. Try searching for another product or clear your search.`
                  : 'Try selecting a different category filter or clear your selection.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="text-xs font-bold text-emerald-700 hover:underline pt-1 cursor-pointer"
                >
                  Clear search and show all items
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Items are packed and delivered fresh from <strong>{shop.name}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
            <Link
              href="/cart"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Go to Cart</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Large Storefront Image Preview Modal */}
      <ShopImageModal
        shop={{
          name: shop.name,
          image: activeShopImage,
          category: shop.category,
          address: shop.address,
          rating: shop.rating,
          reviewCount: shop.reviewCount,
          deliveryTime: shop.deliveryTime,
          isOpen: shop.isOpen,
          isFreeDelivery: shop.isFreeDelivery,
          productCount: products.length,
        }}
        isOpen={isShopImageModalOpen}
        onClose={() => setIsShopImageModalOpen(false)}
      />
    </div>
  );
};
