export interface Category {
  id: string;
  name: string;
  slug: string;
  itemCount: string;
  image: string;
  bgTint: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  isPopular?: boolean;
}

export interface Shop {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: string;
  deliveryTime: string;
  isFreeDelivery: boolean;
  image: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Fresh Vegetables',
    slug: 'vegetables',
    itemCount: '120+ items',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80',
    bgTint: 'bg-emerald-50/70',
  },
  {
    id: 'cat-2',
    name: 'Fruits',
    slug: 'fruits',
    itemCount: '80+ items',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300&auto=format&fit=crop&q=80',
    bgTint: 'bg-amber-50/70',
  },
  {
    id: 'cat-3',
    name: 'Dairy & Eggs',
    slug: 'dairy-eggs',
    itemCount: '65+ items',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80',
    bgTint: 'bg-blue-50/70',
  },
  {
    id: 'cat-4',
    name: 'Snacks & Beverages',
    slug: 'snacks-beverages',
    itemCount: '150+ items',
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=300&auto=format&fit=crop&q=80',
    bgTint: 'bg-orange-50/70',
  },
  {
    id: 'cat-5',
    name: 'Pantry Staples',
    slug: 'pantry-staples',
    itemCount: '95+ items',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
    bgTint: 'bg-stone-50/70',
  },
  {
    id: 'cat-6',
    name: 'Personal Care',
    slug: 'personal-care',
    itemCount: '110+ items',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
    bgTint: 'bg-purple-50/70',
  },
  {
    id: 'cat-7',
    name: 'Household',
    slug: 'household',
    itemCount: '75+ items',
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&auto=format&fit=crop&q=80',
    bgTint: 'bg-sky-50/70',
  },
];

export const FEATURED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Fresh Tomato',
    category: 'Vegetables',
    unit: '1 kg',
    price: 45,
    originalPrice: 55,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80',
    rating: 4.8,
  },
  {
    id: 'prod-2',
    name: 'Banana',
    category: 'Fruits',
    unit: '1 kg',
    price: 60,
    originalPrice: 70,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&auto=format&fit=crop&q=80',
    rating: 4.9,
  },
  {
    id: 'prod-3',
    name: 'Fresh Milk',
    category: 'Dairy',
    unit: '1 liter',
    price: 110,
    originalPrice: 120,
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&auto=format&fit=crop&q=80',
    rating: 4.7,
  },
  {
    id: 'prod-4',
    name: 'Eggs',
    category: 'Dairy & Eggs',
    unit: '12 pcs',
    price: 150,
    originalPrice: 165,
    image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&auto=format&fit=crop&q=80',
    rating: 4.8,
  },
  {
    id: 'prod-5',
    name: 'Bread',
    category: 'Bakery',
    unit: '400 gm',
    price: 55,
    originalPrice: 65,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
    rating: 4.6,
  },
  {
    id: 'prod-6',
    name: 'Cooking Oil',
    category: 'Pantry',
    unit: '1 liter',
    price: 180,
    originalPrice: 200,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80',
    rating: 4.7,
  },
];

export const POPULAR_SHOPS: Shop[] = [
  {
    id: 'shop-1',
    name: 'FreshMart',
    category: 'Grocery & Essentials',
    rating: 4.6,
    reviewCount: '1.2k+',
    deliveryTime: '20-30 mins',
    isFreeDelivery: true,
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'shop-2',
    name: 'Green Valley',
    category: 'Organic & Fresh',
    rating: 4.7,
    reviewCount: '856+',
    deliveryTime: '25-35 mins',
    isFreeDelivery: true,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'shop-3',
    name: 'Daily Needs',
    category: 'Grocery Store',
    rating: 4.6,
    reviewCount: '743+',
    deliveryTime: '15-25 mins',
    isFreeDelivery: true,
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=350&auto=format&fit=crop&q=80',
  },
  {
    id: 'shop-4',
    name: 'Happy Mart',
    category: 'Daily Essentials',
    rating: 4.5,
    reviewCount: '620+',
    deliveryTime: '30-40 mins',
    isFreeDelivery: true,
    image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=350&auto=format&fit=crop&q=80',
  },
];
