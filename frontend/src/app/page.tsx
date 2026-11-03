'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, PackageSearch, Store, ArrowRight } from 'lucide-react';
import { HeroSection } from '@/components/home/HeroSection';
import { CategorySection } from '@/components/home/CategorySection';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { PromoBanners } from '@/components/home/PromoBanners';
import { PopularShopsSection } from '@/components/home/PopularShopsSection';
import { AppDownloadBanner } from '@/components/home/AppDownloadBanner';
import { ProductCard } from '@/components/home/ProductCard';
import { ShopProductsModal } from '@/components/home/ShopProductsModal';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Product, Shop } from '@/data/mockData';

export default function CustomerHomePage() {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real dynamic data added by shop owners ONLY — zero dummy products or dummy shops
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allShops, setAllShops] = useState<Shop[]>([]);

  // Selected shop state (when user clicks a shop in "Popular Shops Near You")
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);

  // Load real products & shops from shop owners
  useEffect(() => {
    try {
      // 1. Gather all products added by shop owners across all merchant store keys
      const loadedProducts: Product[] = [];
      const seenProductIds = new Set<string>();

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('qb_shop_products_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                if (item && item.id && !seenProductIds.has(item.id)) {
                  seenProductIds.add(item.id);
                  loadedProducts.push({
                    id: item.id,
                    name: item.name,
                    category: item.category || 'General',
                    unit: item.unit || '1 unit',
                    price: Number(item.price) || 0,
                    originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
                    image: item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
                    rating: 4.8,
                    stock: item.stock,
                    shopId: item.shopId || key.replace('qb_shop_products_', 'shop_'),
                    shopName: item.shopName,
                  });
                }
              }
            }
          }
        }
      }
      setAllProducts(loadedProducts);

      // 2. Gather all registered shops added by shop owners
      const loadedShops: Shop[] = [];
      const seenShopIds = new Set<string>();

      // Check qb_registered_shops registry
      const rawShops = localStorage.getItem('qb_registered_shops');
      if (rawShops) {
        const parsedShops = JSON.parse(rawShops);
        if (Array.isArray(parsedShops)) {
          for (const s of parsedShops) {
            if (s && s.id && !seenShopIds.has(s.id)) {
              seenShopIds.add(s.id);
              loadedShops.push({
                id: s.id,
                name: s.name,
                category: s.category || 'Retail & Grocery',
                rating: s.rating || 4.8,
                reviewCount: s.reviewCount || 'Verified Store',
                deliveryTime: s.deliveryTime || '20-30 mins',
                isFreeDelivery: s.isFreeDelivery ?? true,
                image: s.image || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=350&auto=format&fit=crop&q=80',
                address: s.address,
                ownerId: s.ownerId,
                ownerEmail: s.ownerEmail,
                isOpen: s.isOpen,
                productCount: s.productCount,
                products: s.products,
              });
            }
          }
        }
      }

      // If current active user is a shop owner, ensure their shop is registered and listed
      if (user && user.role === 'shop_owner') {
        const ownerShopId = `shop_${user.id || user.email}`;
        if (!seenShopIds.has(ownerShopId)) {
          seenShopIds.add(ownerShopId);
          loadedShops.push({
            id: ownerShopId,
            name: user.shopDetails?.shopName?.trim() || `${user.name}'s Store`,
            category: user.shopDetails?.category?.trim() || 'Retail & Grocery',
            rating: 4.9,
            reviewCount: 'Owner Verified',
            deliveryTime: '15-30 mins',
            isFreeDelivery: true,
            image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=350&auto=format&fit=crop&q=80',
            address: user.shopDetails?.address?.trim() || user.address?.street?.trim(),
            ownerId: user.id,
            ownerEmail: user.email,
            isOpen: true,
            productCount: loadedProducts.length,
          });
        }
      }

      setAllShops(loadedShops);
    } catch (err) {
      console.error('Error loading merchant products and shops:', err);
      setAllProducts([]);
      setAllShops([]);
    }
  }, [user]);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSelectCategory = (categoryName: string) => {
    if (!categoryName) {
      setSearchQuery('');
      setTimeout(() => {
        document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return;
    }
    setSearchQuery(categoryName);
    setTimeout(() => {
      document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // When clicking on a shop in Popular Shops Near You
  const handleSelectShop = (shop: Shop) => {
    setSelectedShop(shop);
    setIsShopModalOpen(true);
    setTimeout(() => {
      document.getElementById('shop-showcase')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Derive products specifically added by the selected shop owner
  const selectedShopProducts = useMemo(() => {
    if (!selectedShop) return [];

    // 1. Direct products array saved in shopEntry
    if (selectedShop.products && selectedShop.products.length > 0) {
      return selectedShop.products.map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category || 'General',
        unit: item.unit || '1 unit',
        price: Number(item.price) || 0,
        originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
        image: item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
        rating: 4.8,
        stock: item.stock,
        shopId: selectedShop.id,
        shopName: selectedShop.name,
      }));
    }

    // 2. Filter from all loaded products
    const ownerSuffix = selectedShop.ownerId || selectedShop.ownerEmail || selectedShop.id.replace('shop_', '');
    const matched = allProducts.filter((p) => {
      if (p.shopId && (p.shopId === selectedShop.id || p.shopId === `shop_${ownerSuffix}`)) return true;
      if (p.shopName && p.shopName.toLowerCase() === selectedShop.name.toLowerCase()) return true;
      return false;
    });

    if (matched.length > 0) return matched;

    // 3. Fallback: check localStorage directly for this merchant's keys
    if (typeof window !== 'undefined') {
      try {
        const possibleKeys = [
          `qb_shop_products_${ownerSuffix}`,
          `qb_shop_products_${selectedShop.id}`,
          `qb_shop_products_${selectedShop.ownerId}`,
          `qb_shop_products_${selectedShop.ownerEmail}`,
          'qb_shop_products_guest',
        ];
        for (const k of possibleKeys) {
          if (!k) continue;
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed.map((item: any) => ({
                id: item.id,
                name: item.name,
                category: item.category || 'General',
                unit: item.unit || '1 unit',
                price: Number(item.price) || 0,
                originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
                image: item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
                rating: 4.8,
                stock: item.stock,
                shopId: selectedShop.id,
                shopName: selectedShop.name,
              }));
            }
          }
        }
      } catch (err) {
        console.warn('Error reading store products from storage:', err);
      }
    }

    // 4. If this is the only registered store and products exist, display them
    if (allShops.length <= 1 && allProducts.length > 0) {
      return allProducts;
    }

    return [];
  }, [selectedShop, allProducts, allShops.length]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return allProducts.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(q);
      const catMatch = product.category.toLowerCase().includes(q);
      const unitMatch = product.unit?.toLowerCase().includes(q);
      return nameMatch || catMatch || unitMatch;
    });
  }, [searchQuery, allProducts]);

  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-12">
      {/* 1. Hero Section with Live Search Bar */}
      <HeroSection
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        allProducts={allProducts}
        onAddToCart={handleAddToCart}
      />

      {/* 2. Search Results Section (visible when search is active) */}
      {isSearchActive && (
        <section
          id="search-results"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 scroll-mt-24"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-emerald-100 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#15803d] flex items-center justify-center shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-[#0f3d23] tracking-tight">
                    Search Results
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing matches for &ldquo;<span className="font-bold text-slate-800">{searchQuery}</span>&rdquo;
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearSearch}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Clear Search</span>
            </button>
          </div>

          {/* Grid of Results or Empty State */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <PackageSearch className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  No products found matching &ldquo;{searchQuery}&rdquo;
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Only products added by verified shop owners appear in search. Try a different keyword or explore registered shops below.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. Shop by Category */}
      <CategorySection onSelectCategory={handleSelectCategory} />

      {/* 4. Featured Products (Only products added by shop owners) */}
      <FeaturedProductsSection
        products={allProducts}
        onAddToCart={handleAddToCart}
      />

      {/* 5. Promotional Banners */}
      <PromoBanners />

      {/* 6. Popular Shops Near You (Only shops registered by shop owners) */}
      <PopularShopsSection
        shops={allShops}
        onSelectShop={handleSelectShop}
        selectedShopId={selectedShop?.id}
      />

      {/* 6.1 Selected Shop In-Page Product Showcase (Visible when a store is selected) */}
      {selectedShop && (
        <section
          id="shop-showcase"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 scroll-mt-24"
        >
          <div className="bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 rounded-3xl border border-emerald-200/80 p-5 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-emerald-100/80 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-2xs">
                  <img
                    src={selectedShop.image}
                    alt={selectedShop.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-[#0f3d23] tracking-tight">
                      Products from {selectedShop.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {selectedShopProducts.length} {selectedShopProducts.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Browse authentic products added directly by this neighborhood store owner
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsShopModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors cursor-pointer"
                >
                  Open Full Storefront
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShop(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Grid of products from this shop owner */}
            {selectedShopProducts.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
                {selectedShopProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center max-w-md mx-auto space-y-2">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <PackageSearch className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No products listed yet</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The owner of {selectedShop.name} has not listed any items in their store catalog yet. When they list products, they will automatically appear here!
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 7. Download QuickBasket App Banner */}
      <AppDownloadBanner />

      {/* 8. Full Storefront Modal (Opens when user clicks a shop card) */}
      <ShopProductsModal
        shop={selectedShop}
        products={selectedShopProducts}
        isOpen={isShopModalOpen}
        onClose={() => setIsShopModalOpen(false)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
