'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Edit2,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { compressImageFile, syncShopImageToStorage, getStoredShopImage } from '@/lib/imageUtils';

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
  const { user, isLoading, updateShopDetails, updateUserProfile } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');

  // Client-side RBAC guard
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login?redirect=/shop');
      } else if (user.role !== 'shop_owner' && user.role !== 'admin') {
        router.replace(user.role === 'customer' ? '/' : user.role === 'delivery_partner' ? '/delivery' : '/');
      }
    }
  }, [isLoading, user, router]);

  // Sync tab from URL query params (e.g. ?tab=orders or ?tab=catalog from footer/header links)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkTabFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab === 'orders' || tab === 'catalog') {
          setActiveTab(tab);
        }
      };
      checkTabFromUrl();
      window.addEventListener('popstate', checkTabFromUrl);
      return () => window.removeEventListener('popstate', checkTabFromUrl);
    }
  }, []);

  // Shop Owner Details Edit State
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
        setOwnerSuccess('Shop owner details updated successfully!');
        setTimeout(() => setOwnerSuccess(null), 4000);
      } else {
        setOwnerError(res.message || 'Failed to update shop owner details');
      }
    } catch (err) {
      setOwnerError(err instanceof Error ? err.message : 'Error updating shop owner details');
    } finally {
      setIsSavingOwner(false);
    }
  };

  // Registered Storefront Details Edit State
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeImage, setStoreImage] = useState('');
  const [localShopImage, setLocalShopImage] = useState<string>('');
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [storeSuccess, setStoreSuccess] = useState<string | null>(null);

  // Hidden file input ref for top welcome banner image upload
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize and synchronize active storefront details from user or stored registry
  useEffect(() => {
    const activeName =
      user?.shopDetails?.shopName?.trim() ||
      (user?.name ? `${user.name}'s Store` : 'My Hyperlocal Store');
    const existingImg = getStoredShopImage({
      name: activeName,
      image: user?.shopDetails?.image,
      ownerEmail: user?.email,
      ownerId: user?.id,
    });
    if (existingImg && !existingImg.includes('photo-1578916171728-46686eac8d58')) {
      setLocalShopImage(existingImg);
    }
  }, [user?.shopDetails, user?.name, user?.email, user?.id]);

  const handleStartEditStore = () => {
    const currentName = user?.shopDetails?.shopName || '';
    setStoreName(currentName);
    setStoreCategory(user?.shopDetails?.category || 'General Store');
    setStoreAddress(user?.shopDetails?.address || user?.address?.street || '');
    setStoreImage(user?.shopDetails?.image || localShopImage || '');
    setStoreError(null);
    setStoreSuccess(null);
    setIsEditingStore(true);
  };

  const handleCancelEditStore = () => {
    setIsEditingStore(false);
    setStoreError(null);
  };

  const handleStoreImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStoreError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    try {
      // Compress and optimize down to ~50-80KB to fit easily in storage and prevent quota issues
      const compressedDataUrl = await compressImageFile(file, 800, 800, 0.82);
      if (compressedDataUrl) {
        setStoreImage(compressedDataUrl);
        setStoreError(null);
      }
    } catch (err) {
      console.error('Failed to compress store image:', err);
      setStoreError('Failed to process image file. Please try another image.');
    }
  };

  // Immediate upload & save directly from top welcome banner
  const handleBannerImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStoreError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    try {
      const compressed = await compressImageFile(file, 800, 800, 0.82);
      if (!compressed) return;

      const currentName =
        user?.shopDetails?.shopName?.trim() ||
        (user?.name ? `${user.name}'s Store` : 'My Hyperlocal Store');
      const currentCategory =
        user?.shopDetails?.category?.trim() || 'Retail & Grocery';
      const currentAddress =
        user?.shopDetails?.address?.trim() ||
        user?.address?.street?.trim() ||
        'Store address not set';

      setLocalShopImage(compressed);
      setStoreImage(compressed);

      // 1. Immediately persist across storage & registry
      syncShopImageToStorage({
        shopName: currentName,
        image: compressed,
        category: currentCategory,
        address: currentAddress,
        ownerId: user?.id,
        ownerEmail: user?.email,
        isOpen,
      });

      // 2. Persist to backend
      await updateShopDetails({
        shopName: currentName,
        category: currentCategory,
        address: currentAddress,
        image: compressed,
      });

      setStoreSuccess('Shop storefront image updated and published to customer views!');
      setTimeout(() => setStoreSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to update banner image:', err);
      setStoreError('Failed to process image file.');
    }
  };

  const handleSaveStoreDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setStoreError('Shop name cannot be empty.');
      return;
    }

    setIsSavingStore(true);
    setStoreError(null);

    const cleanImg = storeImage.trim();

    // 1. Sync to local storage & registered shops immediately
    syncShopImageToStorage({
      shopName: storeName.trim(),
      image: cleanImg,
      category: storeCategory.trim(),
      address: storeAddress.trim(),
      ownerId: user?.id,
      ownerEmail: user?.email,
      isOpen: isOpen,
    });
    setLocalShopImage(cleanImg);

    // 2. Persist to API
    const res = await updateShopDetails({
      shopName: storeName.trim(),
      category: storeCategory.trim(),
      address: storeAddress.trim(),
      image: cleanImg,
    });

    setIsSavingStore(false);

    if (res.success) {
      setIsEditingStore(false);
      setStoreSuccess('Registered storefront details and shop image updated successfully!');
      setTimeout(() => setStoreSuccess(null), 4000);
    } else {
      // Even if backend fails (e.g. offline/guest mode), local changes were already saved
      setIsEditingStore(false);
      setStoreSuccess('Storefront details updated locally and published to customer view!');
      setTimeout(() => setStoreSuccess(null), 4000);
    }
  };

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
      const currentShopName =
        user?.shopDetails?.shopName?.trim() ||
        (user?.name ? `${user.name}'s Store` : 'My Hyperlocal Store');
      const currentCategory =
        user?.shopDetails?.category?.trim() || 'Retail & Grocery';
      const currentAddress =
        user?.shopDetails?.address?.trim() ||
        user?.address?.street?.trim() ||
        'Store address not set';

      const currentImage =
        user?.shopDetails?.image?.trim() ||
        localShopImage ||
        getStoredShopImage({
          name: currentShopName,
          image: user?.shopDetails?.image,
          ownerEmail: user?.email,
          ownerId: user?.id,
        });

      syncShopImageToStorage({
        shopName: currentShopName,
        image: currentImage,
        category: currentCategory,
        address: currentAddress,
        ownerId: user.id,
        ownerEmail: user.email,
        isOpen,
      });
    }
  }, [user, isOpen, products.length, isProductsLoaded, localShopImage]);

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

  if (isLoading || !user || (user.role !== 'shop_owner' && user.role !== 'admin')) {
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
  const shopImage = user?.shopDetails?.image?.trim() || localShopImage;
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Shop Image avatar in banner with interactive Change / Add Photo trigger */}
            <div className="relative group">
              {shopImage ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white/50 shadow-md shrink-0 bg-white">
                  <img src={shopImage} alt={shopName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 border-2 border-dashed border-white/30 flex flex-col items-center justify-center text-emerald-200 shrink-0">
                  <Store className="w-8 h-8 mb-1" />
                  <span className="text-[10px] text-white/80 font-bold">No Image</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => bannerFileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer backdrop-blur-2xs shadow-md"
                title="Click to change shop image"
              >
                <Camera className="w-4 h-4 mb-0.5" />
                <span>{shopImage ? 'Change' : '+ Add'}</span>
              </button>
            </div>
            <input
              type="file"
              ref={bannerFileInputRef}
              accept="image/*"
              onChange={handleBannerImageFileChange}
              className="hidden"
            />
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
                <Link
                  href="/addresses"
                  className="flex items-center gap-1.5 hover:text-white hover:underline transition-colors cursor-pointer"
                  title="Manage Shop Locations"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{address}</span>
                </Link>
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
          </div>

          {/* Store Online / Offline Toggle */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col items-center justify-center min-w-[200px]">
            <span className="text-xs font-medium text-emerald-100 mb-2">Store Order Receiving</span>
            <button
              type="button"
              disabled={!isApproved}
              onClick={() => isApproved && setIsOpen(!isOpen)}
              className={`w-full py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                !isApproved
                  ? 'bg-amber-500/80 text-white cursor-not-allowed opacity-90'
                  : isOpen
                  ? 'bg-emerald-400 text-emerald-950 shadow-md hover:bg-emerald-300 cursor-pointer'
                  : 'bg-red-500/90 text-white hover:bg-red-500 cursor-pointer'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${!isApproved ? 'bg-amber-200' : isOpen ? 'bg-emerald-900 animate-ping' : 'bg-white'}`} />
              <span>{!isApproved ? 'Pending Approval' : isOpen ? 'Store is OPEN' : 'Store is CLOSED'}</span>
            </button>
            <span className="text-[10px] text-emerald-200 mt-1">
              {!isApproved ? 'Verification required to receive orders' : isOpen ? 'Nearby shoppers can place orders' : 'Paused new customer dispatches'}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Approval Notice */}
      {!isApproved && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <h4 className="font-extrabold text-sm text-amber-950">Storefront Pending Admin Approval</h4>
            <p className="text-amber-800 leading-relaxed">
              Your store profile and catalog are currently under administrative review. Once verified, order receiving and customer dispatches will be unlocked automatically.
            </p>
          </div>
        </div>
      )}

      {/* Shop Owner Details Card with Fully Functional Edit Option Top Right */}
      <div className="bg-white rounded-3xl border border-emerald-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-emerald-100">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Shop Owner Details</span>
          </h2>
          {!isEditingOwner ? (
            <button
              type="button"
              onClick={handleStartEditOwner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
              title="Edit Shop Owner Details"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelEditOwner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              title="Cancel Editing"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {ownerSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{ownerSuccess}</span>
          </div>
        )}

        {!isEditingOwner ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            {/* Owner Avatar Box */}
            <div className="sm:col-span-1 p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white font-extrabold text-xl flex items-center justify-center shadow-sm">
                {(user?.name || 'S').charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-xs block">{user?.name || 'Merchant Partner'}</span>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Verified Shop Owner</span>
              </div>
            </div>

            <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Owner Name</span>
                <p className="font-extrabold text-slate-900 text-sm">{user?.name || 'Not set'}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Registered Email</span>
                <p className="font-semibold text-slate-800 truncate" title={user?.email}>{user?.email || 'Not configured'}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Contact Phone</span>
                <p className="font-semibold text-slate-800">{user?.phone || 'Not configured'}</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveOwnerDetails} className="space-y-4 pt-1">
            {ownerError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{ownerError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Owner Full Name <span className="text-red-500">*</span>
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
                  value={user?.email || ''}
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
                    <span>Save Owner Details</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Registered Storefront Details Card with Edit & Shop Image */}
      <div className="bg-white rounded-3xl border border-emerald-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-emerald-100">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            <span>Registered Storefront Details</span>
          </h2>
          {!isEditingStore ? (
            <button
              type="button"
              onClick={handleStartEditStore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
              title="Edit Storefront Details & Shop Image"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelEditStore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              title="Cancel Editing"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {storeSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{storeSuccess}</span>
          </div>
        )}

        {!isEditingStore ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            {/* Shop Image Box */}
            <div className="sm:col-span-1 p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block self-start">
                Shop Image
              </span>
              {shopImage ? (
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-sm relative group bg-white">
                  <img
                    src={shopImage}
                    alt={shopName}
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
                onClick={handleStartEditStore}
                className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                {shopImage ? 'Change Photo' : '+ Add Photo'}
              </button>
            </div>

            <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Shop Name</span>
                <p className="font-extrabold text-slate-900 text-sm">{shopName}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Store Category</span>
                <p className="font-semibold text-slate-800">{category}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Store Address</span>
                <p className="font-semibold text-slate-800">{address}</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveStoreDetails} className="space-y-4 pt-1">
            {storeError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{storeError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
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
                  value={storeCategory}
                  onChange={(e) => setStoreCategory(e.target.value)}
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
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
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
                {storeImage && (
                  <button
                    type="button"
                    onClick={() => setStoreImage('')}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-300 shadow-xs bg-white shrink-0 flex items-center justify-center">
                  {storeImage ? (
                    <img
                      src={storeImage}
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
                        onChange={handleStoreImageFileChange}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-500">or enter image link below:</span>
                  </div>

                  <input
                    type="url"
                    value={storeImage}
                    onChange={(e) => setStoreImage(e.target.value)}
                    placeholder="https://images.unsplash.com/... or paste image URL"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-xs text-slate-800 bg-white"
                  />

                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-slate-500 font-medium">Sample images:</span>
                    <button
                      type="button"
                      onClick={() => setStoreImage('https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=80')}
                      className="text-[10px] text-emerald-700 hover:underline font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer"
                    >
                      Supermarket
                    </button>
                    <button
                      type="button"
                      onClick={() => setStoreImage('https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80')}
                      className="text-[10px] text-emerald-700 hover:underline font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer"
                    >
                      Fresh Fruits & Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setStoreImage('https://images.unsplash.com/photo-1526367790999-0150786686a2?w=500&auto=format&fit=crop&q=80')}
                      className="text-[10px] text-emerald-700 hover:underline font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer"
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
                onClick={handleCancelEditStore}
                disabled={isSavingStore}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingStore}
                className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60 shadow-xs cursor-pointer"
              >
                {isSavingStore ? (
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

