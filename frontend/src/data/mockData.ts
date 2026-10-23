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
  stock?: number;
  shopId?: string;
  shopName?: string;
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
  address?: string;
  ownerId?: string;
  ownerEmail?: string;
  isOpen?: boolean;
  productCount?: number;
  products?: Product[];
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
  {
    id: 'cat-8',
    name: 'Bakery & Bread',
    slug: 'bakery-bread',
    itemCount: '45+ items',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80',
    bgTint: 'bg-amber-50/70',
  },
  {
    id: 'cat-9',
    name: 'Instant & Frozen',
    slug: 'instant-frozen',
    itemCount: '60+ items',
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?w=300&auto=format&fit=crop&q=80',
    bgTint: 'bg-cyan-50/70',
  },
  {
    id: 'cat-10',
    name: 'Organic & Gourmet',
    slug: 'organic-gourmet',
    itemCount: '40+ items',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
    bgTint: 'bg-emerald-50/70',
  },
  {
    id: 'cat-11',
    name: 'Tea, Coffee & Drinks',
    slug: 'tea-coffee-drinks',
    itemCount: '85+ items',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80',
    bgTint: 'bg-yellow-50/70',
  },
  {
    id: 'cat-12',
    name: 'Cleaning & Hygiene',
    slug: 'cleaning-hygiene',
    itemCount: '50+ items',
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&auto=format&fit=crop&q=80',
    bgTint: 'bg-teal-50/70',
  },
];

export const FEATURED_PRODUCTS: Product[] = [];

export const POPULAR_SHOPS: Shop[] = [];

