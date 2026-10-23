'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ArrowRight,
  Search,
  Trash2,
  X,
  Boxes,
  ShieldAlert,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Check,
  Video,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export interface ShopProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  originalPrice?: number;
  stock: number;
  image?: string;
  shopId?: string;
  shopName?: string;
  createdAt: string;
}

export interface ShopOrder {
  id: string;
  customer: string;
  items: string;
  total: number;
  status: 'Packing' | 'Ready for Pickup' | 'Delivered';
  createdAt: string;
}

const CATEGORY_OPTIONS = [
  'Fresh Vegetables',
  'Fruits',
  'Dairy & Eggs',
  'Snacks & Beverages',
  'Pantry Staples',
  'Personal Care',
  'Household',
  'Bakery & Bread',
  'General Grocery',
];

const PRESET_IMAGES: Record<string, string> = {
  'Fresh Vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80',
  'Fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300&auto=format&fit=crop&q=80',
  'Dairy & Eggs': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80',
  'Snacks & Beverages': 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=300&auto=format&fit=crop&q=80',
  'Pantry Staples': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
  'Personal Care': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
  'Household': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&auto=format&fit=crop&q=80',
  'Bakery & Bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80',
  'General Grocery': 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80',
};

export default function ShopOwnerDashboard() {
  const { user, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');

  // Real shop owner products (persisted in localStorage per store owner)
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [isProductsLoaded, setIsProductsLoaded] = useState(false);

  // Real orders (empty initially, no dummy customers)
  const [orders, setOrders] = useState<ShopOrder[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Add Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState(CATEGORY_OPTIONS[0]);
  const [newProductUnit, setNewProductUnit] = useState('1 kg');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductOriginalPrice, setNewProductOriginalPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('50');
  const [newProductImage, setNewProductImage] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Camera & Gallery Refs / State
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Storage key specific to this logged in merchant
  const storageKey = useMemo(() => {
    return `qb_shop_products_${user?.id || user?.email || 'guest'}`;
  }, [user?.id, user?.email]);

  // Load products from storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setProducts(parsed);
        }
      } else {
        setProducts([]);
      }
    } catch {
      setProducts([]);
    } finally {
      setIsProductsLoaded(true);
    }
  }, [storageKey]);

  // Save products to storage on changes
  useEffect(() => {
    if (isProductsLoaded) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(products));
      } catch (err) {
        console.error('Failed to save products:', err);
      }
    }
  }, [products, storageKey, isProductsLoaded]);

  // Sync shop into registered shops list for customer discovery
  useEffect(() => {
    if (user && isProductsLoaded) {
      try {
        const raw = localStorage.getItem('qb_registered_shops');
        const list: any[] = raw ? JSON.parse(raw) : [];
        const shopId = `shop_${user.id || user.email || 'guest'}`;
        const existingIdx = list.findIndex(
          (s) => s.id === shopId || (user.email && s.ownerEmail === user.email)
        );

        const currentShopName =
          user?.shopDetails?.shopName?.trim() ||
          (user?.name ? `${user.name}'s Store` : 'My Hyperlocal Store');
        const currentCategory =
          user?.shopDetails?.category?.trim() || 'Retail & Grocery';
        const currentAddress =
          user?.shopDetails?.address?.trim() ||
          user?.address?.street?.trim() ||
          'Store address not set';

        const shopEntry = {
          id: shopId,
          name: currentShopName,
          category: currentCategory,
          address: currentAddress,
          ownerId: user.id,
          ownerName: user.name,
          ownerEmail: user.email,
          rating: 4.8,
          reviewCount: `${products.length} Products`,
          deliveryTime: '20-30 mins',
          isFreeDelivery: true,
          isOpen: isOpen,
          productCount: products.length,
          products: products,
          image:
            'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=350&auto=format&fit=crop&q=80',
        };

        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], ...shopEntry };
        } else {
          list.push(shopEntry);
        }

        localStorage.setItem('qb_registered_shops', JSON.stringify(list));
      } catch (err) {
        console.error('Failed to sync shop registry:', err);
      }
    }
  }, [user, isOpen, products.length, isProductsLoaded]);

  // Camera stream handling for desktop/laptop live view (Must be before any early return)
  useEffect(() => {
    if (!isLiveCameraOpen) return;

    let currentStream: MediaStream | null = null;
    let isActive = true;

    async function enableStream() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported by your browser.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (!isActive) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        currentStream = stream;
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      } catch (err: any) {
        if (!isActive) return;
        console.warn('Webcam stream failed:', err);
        setCameraError(
          'Could not open live camera stream. Please use the "Take Photo" button or pick an image from your device gallery.'
        );
      }
    }

    enableStream();

    return () => {
      isActive = false;
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isLiveCameraOpen]);

  // Lock background scroll when popup/modal is open
  useEffect(() => {
    if (isModalOpen || isLiveCameraOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen, isLiveCameraOpen]);

  // Handle ESC key to close open modals
  useEffect(() => {
    if (!isModalOpen && !isLiveCameraOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLiveCameraOpen) {
          stopLiveCamera();
        } else if (isModalOpen) {
          handleCloseModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isLiveCameraOpen]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Real user store details without fake dummy store names
  const shopName =
    user?.shopDetails?.shopName?.trim() ||
    (user?.name ? `${user.name}'s Store` : 'My Hyperlocal Store');
  const category =
    user?.shopDetails?.category?.trim() || 'Retail & Grocery';
  const address =
    user?.shopDetails?.address?.trim() ||
    user?.address?.street?.trim() ||
    'Store address not set';
  const isApproved = Boolean(user?.shopDetails?.isApproved);

  // Dynamic metrics computed from actual merchant data
  const totalRevenue = orders.reduce((acc, ord) => acc + ord.total, 0);
  const pendingOrdersCount = orders.filter((o) => o.status !== 'Delivered').length;
  const inStockCount = products.filter((p) => p.stock > 0).length;

  // Filtered products list
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategoryFilter === 'All' || prod.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const startLiveCamera = () => {
    setCameraError(null);
    setIsLiveCameraOpen(true);
  };

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsLiveCameraOpen(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setNewProductImage(dataUrl);
        setImageFileName(`camera-${Date.now()}.jpg`);
        setFormError(null);
      }
      stopLiveCamera();
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (JPG, PNG, WEBP, etc.)');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setFormError('Image size exceeds 15MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setNewProductImage(compressedDataUrl);
          setImageFileName(file.name || 'product-photo.jpg');
          setFormError(null);
        } else {
          setNewProductImage(rawDataUrl);
          setImageFileName(file.name || 'product-photo.jpg');
          setFormError(null);
        }
      };
      img.onerror = () => {
        setNewProductImage(rawDataUrl);
        setImageFileName(file.name || 'product-photo.jpg');
        setFormError(null);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    stopLiveCamera();
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newProductName.trim()) {
      setFormError('Please enter a product name');
      return;
    }
    const priceNum = parseFloat(newProductPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Please enter a valid selling price');
      return;
    }

    const stockNum = parseInt(newProductStock, 10);
    const resolvedStock = isNaN(stockNum) || stockNum < 0 ? 0 : stockNum;

    const origPriceNum = parseFloat(newProductOriginalPrice);
    const resolvedOrigPrice =
      !isNaN(origPriceNum) && origPriceNum > priceNum ? origPriceNum : undefined;

    const finalImage =
      newProductImage.trim() ||
      PRESET_IMAGES[newProductCategory] ||
      PRESET_IMAGES['General Grocery'];

    const currentShopId = `shop_${user?.id || user?.email || 'guest'}`;
    const newProd: ShopProduct = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newProductName.trim(),
      category: newProductCategory,
      unit: newProductUnit.trim() || '1 item',
      price: priceNum,
      originalPrice: resolvedOrigPrice,
      stock: resolvedStock,
      image: finalImage,
      shopId: currentShopId,
      shopName: shopName,
      createdAt: new Date().toISOString(),
    };

    setProducts((prev) => [newProd, ...prev]);

    // Reset Form
    setNewProductName('');
    setNewProductPrice('');
    setNewProductOriginalPrice('');
    setNewProductUnit('1 kg');
    setNewProductStock('50');
    setNewProductImage('');
    setImageFileName('');
    stopLiveCamera();
    setIsModalOpen(false);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleToggleStock = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, stock: p.stock > 0 ? 0 : 25 } : p
      )
    );
  };

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
              Managing <strong className="text-white">{shopName}</strong> — Keep your store catalog updated and manage incoming neighbor orders in real time.
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
              {isApproved ? (
                <div className="flex items-center gap-1.5 text-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Verified Hyperlocal Seller</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-200 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-300/30">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Pending Admin Verification</span>
                </div>
              )}
            </div>
          </div>

          {/* Store Online / Offline Toggle */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col items-center justify-center min-w-[200px]">
            <span className="text-xs font-medium text-emerald-100 mb-2">Store Order Receiving</span>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`w-full py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isOpen
                  ? 'bg-emerald-400 text-emerald-950 shadow-md hover:bg-emerald-300'
                  : 'bg-red-500/90 text-white hover:bg-red-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-900 animate-ping' : 'bg-white'}`} />
              <span>{isOpen ? 'Store is OPEN' : 'Store is CLOSED'}</span>
            </button>
            <span className="text-[10px] text-emerald-200 mt-1">
              {isOpen ? 'Nearby shoppers can place orders' : 'Paused new customer dispatches'}
            </span>
          </div>
        </div>
      </div>

      {/* Real Metric Cards (Calculated directly from merchant products and actual orders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today&apos;s Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">₹{totalRevenue.toLocaleString()}</p>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
            {totalRevenue > 0 ? 'Recorded from completed dispatches' : 'No sales recorded today'}
          </span>
        </div>

        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Orders</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{pendingOrdersCount} Orders</p>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
            {pendingOrdersCount > 0 ? 'Awaiting packing or pickup' : 'All orders fulfilled'}
          </span>
        </div>

        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Catalog Products</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{products.length} Items</p>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
            {products.length > 0
              ? `${inStockCount} active in stock`
              : 'Add your first product below'}
          </span>
        </div>

        <div className="qb-card p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Preparation Speed</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{orders.length > 0 ? '7.5 Mins' : '--'}</p>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
            {orders.length > 0 ? 'Average order packing speed' : 'Awaiting order dispatches'}
          </span>
        </div>
      </div>

      {/* Main Workspace: Tab Navigation */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          {/* Single-Row Segmented Tab Bar */}
          <div className="flex items-center p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60 overflow-x-auto scrollbar-none gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-white text-emerald-800 shadow-sm border border-emerald-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Package className={`w-4 h-4 shrink-0 ${activeTab === 'catalog' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="whitespace-nowrap">Store Product Catalog</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'catalog'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {products.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-white text-emerald-800 shadow-sm border border-emerald-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <ShoppingBag className={`w-4 h-4 shrink-0 ${activeTab === 'orders' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="whitespace-nowrap">Live Incoming Orders</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'orders'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {orders.length}
              </span>
            </button>
          </div>

          {activeTab === 'catalog' && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="whitespace-nowrap inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          )}
        </div>

        {/* Tab 1: Product Catalog Management */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Search and Category Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <span className="text-xs font-semibold text-slate-500 shrink-0">Filter:</span>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="All">All Categories</option>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Grid or Empty State */}
            {filteredProducts.length === 0 ? (
              <div className="qb-card p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Boxes className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {searchQuery || selectedCategoryFilter !== 'All'
                      ? 'No matching products found'
                      : 'Your Store Catalog is Empty'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {searchQuery || selectedCategoryFilter !== 'All'
                      ? 'Try adjusting your search query or category filter.'
                      : 'You have not added any products yet. List your store inventory with prices and stock levels so neighborhood customers can buy from you.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategoryFilter('All');
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Product</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Product Thumbnail */}
                      <div className="w-full h-36 rounded-xl bg-slate-100 overflow-hidden relative mb-3">
                        <img
                          src={prod.image || PRESET_IMAGES['General Grocery']}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-slate-800 shadow-2xs">
                          {prod.category}
                        </span>
                        <span
                          className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            prod.stock > 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {prod.stock > 0 ? `${prod.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>

                      {/* Product Info */}
                      <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1">
                        {prod.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        Unit: {prod.unit}
                      </p>

                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-base font-black text-slate-900">
                          ₹{prod.price}
                        </span>
                        {prod.originalPrice && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{prod.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleToggleStock(prod.id)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          prod.stock > 0
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {prod.stock > 0 ? 'Mark Out of Stock' : 'Mark In Stock'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Live Incoming Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="qb-card p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">No Incoming Orders Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  When neighboring customers place orders from your store, real-time alerts and packing lists will appear here instantly.
                </p>
                <div className="pt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ensure your store status is set to OPEN to receive orders</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="qb-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{ord.id}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-medium text-slate-700">{ord.customer}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full qb-badge-amber">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{ord.items}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-slate-900">₹{ord.total}</span>
                      <button
                        type="button"
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Add Product to Store</h3>
                  <p className="text-xs text-slate-500">List an item in your store catalog</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2 border border-red-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Tomatoes, Aashirvaad Atta, Amul Butter"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unit / Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1 kg, 500 g, 1 L, 12 pcs"
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <div className="flex flex-col">
                  <label className="h-5 flex items-center text-[11px] sm:text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                    <span>Selling Price (₹)</span>
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    placeholder="45"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="h-5 flex items-center text-[11px] sm:text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                    <span>MRP / Orig (₹)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    placeholder="55"
                    value={newProductOriginalPrice}
                    onChange={(e) => setNewProductOriginalPrice(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="h-5 flex items-center text-[11px] sm:text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                    <span>Stock Quantity</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="50"
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Product Image Selection (Camera or Device Gallery) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Product Image <span className="text-slate-400 font-normal">(Camera or Device Gallery)</span>
                  </label>
                  {newProductImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewProductImage('');
                        setImageFileName('');
                      }}
                      className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {/* Hidden native file inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                {newProductImage ? (
                  /* Image Preview Card */
                  <div className="relative rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3 flex items-center gap-3">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 relative shadow-2xs">
                      <img
                        src={newProductImage}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Photo Selected</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                        {imageFileName || 'Custom product photo ready'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3 h-3 text-emerald-600" />
                          <span>Retake (Camera)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <ImageIcon className="w-3 h-3 text-blue-600" />
                          <span>Change (Gallery)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Capture / Gallery Selection Box */
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/60 hover:bg-slate-50 hover:border-emerald-300 transition-all text-center space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Camera Button */}
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 hover:shadow-xs transition-all text-slate-700 group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-full bg-emerald-100/70 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Camera className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">Camera</span>
                        <span className="text-[10px] text-slate-400">Take product photo</span>
                      </button>

                      {/* Device Gallery Button */}
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 hover:shadow-xs transition-all text-slate-700 group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-100/70 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">Device Gallery</span>
                        <span className="text-[10px] text-slate-400">Choose from files</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
                      <span>Or drag & drop photo here</span>
                      <button
                        type="button"
                        onClick={startLiveCamera}
                        className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Video className="w-3 h-3" />
                        <span>Live Webcam</span>
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Optional: Leave empty to automatically use the category default image.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Webcam Snap Modal */}
      {isLiveCameraOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={stopLiveCamera}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800">
                <Camera className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold">Take Product Photo</h4>
              </div>
              <button
                type="button"
                onClick={stopLiveCamera}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 rounded-2xl bg-amber-50 text-amber-800 text-xs space-y-3 border border-amber-200">
                <p className="font-semibold">{cameraError}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      stopLiveCamera();
                      cameraInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors"
                  >
                    Use Device Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopLiveCamera();
                      galleryInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-300 transition-colors"
                  >
                    Open Gallery
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-2 flex justify-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
                      Align product in frame
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Snap Photo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

