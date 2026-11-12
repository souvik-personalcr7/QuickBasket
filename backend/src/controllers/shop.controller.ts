import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { AppError } from '../utils/appError';

// 1. Get all public registered shops with active product counts
export const getShops = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const shopOwners = await User.find({
      role: 'shop_owner',
      isActive: true,
    }).sort({ createdAt: -1 });

    const shops = await Promise.all(
      shopOwners.map(async (owner) => {
        const productCount = await Product.countDocuments({
          shopId: owner._id,
          isAvailable: true,
        });

        const rawImage = owner.shopDetails?.image?.trim();
        const fallbackImage =
          'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=350&auto=format&fit=crop&q=80';

        return {
          id: owner._id.toString(),
          name: owner.shopDetails?.shopName?.trim() || (owner.name ? `${owner.name}'s Store` : 'Local Store'),
          category: owner.shopDetails?.category?.trim() || 'Retail & Grocery',
          address: owner.shopDetails?.address?.trim() || owner.address?.street || 'Local Store',
          image: rawImage || fallbackImage,
          rating: 4.8,
          reviewCount: 'Verified Store',
          deliveryTime: '20-30 mins',
          isFreeDelivery: true,
          ownerId: owner._id.toString(),
          ownerEmail: owner.email,
          isOpen: true,
          productCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: shops.length,
      data: shops,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get a single shop by ID along with its products
export const getShopById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const owner = await User.findOne({
      _id: id,
      role: 'shop_owner',
      isActive: true,
    });

    if (!owner) {
      throw new AppError('Shop not found', 404);
    }

    const products = await Product.find({
      shopId: owner._id,
      isAvailable: true,
    }).sort({ createdAt: -1 });

    const rawImage = owner.shopDetails?.image?.trim();
    const fallbackImage =
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=350&auto=format&fit=crop&q=80';

    const shop = {
      id: owner._id.toString(),
      name: owner.shopDetails?.shopName?.trim() || (owner.name ? `${owner.name}'s Store` : 'Local Store'),
      category: owner.shopDetails?.category?.trim() || 'Retail & Grocery',
      address: owner.shopDetails?.address?.trim() || owner.address?.street || 'Local Store',
      image: rawImage || fallbackImage,
      rating: 4.8,
      reviewCount: 'Verified Store',
      deliveryTime: '20-30 mins',
      isFreeDelivery: true,
      ownerId: owner._id.toString(),
      ownerEmail: owner.email,
      isOpen: true,
      productCount: products.length,
      products,
    };

    res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    next(error);
  }
};

