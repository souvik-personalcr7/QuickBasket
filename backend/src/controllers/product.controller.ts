import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Product } from '../models/Product';
import { AppError } from '../utils/appError';

// 1. Get all public products (with optional shopId, category, and search filters)
export const getProducts = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { shopId, category, search } = req.query;

    const filter: Record<string, any> = { isAvailable: true };

    if (shopId && typeof shopId === 'string') {
      filter.shopId = shopId;
    }

    if (category && typeof category === 'string' && category.toLowerCase() !== 'all') {
      filter.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { category: { $regex: term, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get all products belonging to the logged-in Shop Owner
export const getMyShopProducts = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const products = await Product.find({ shopId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create a new product for the logged-in Shop Owner
export const createProduct = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { name, category, unit, price, originalPrice, image, stock } = req.body;

    if (!name || !price) {
      throw new AppError('Product name and price are required', 400);
    }

    const shopName =
      req.user.shopDetails?.shopName?.trim() ||
      (req.user.name ? `${req.user.name}'s Store` : 'Local Store');

    const product = await Product.create({
      name: name.trim(),
      category: category?.trim() || 'General',
      unit: unit?.trim() || '1 unit',
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      image: image?.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
      stock: stock !== undefined ? Number(stock) : 50,
      shopId: req.user._id,
      shopName,
      isAvailable: true,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Bulk sync products from localStorage into MongoDB for this Shop Owner
export const bulkSyncProducts = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      res.status(200).json({
        success: true,
        message: 'No products to sync',
        data: [],
      });
      return;
    }

    const shopName =
      req.user.shopDetails?.shopName?.trim() ||
      (req.user.name ? `${req.user.name}'s Store` : 'Local Store');

    const syncedProducts = [];

    for (const item of products) {
      if (!item || !item.name || item.price === undefined) continue;

      // Upsert: match by shopId and normalized name
      const existing = await Product.findOne({
        shopId: req.user._id,
        name: { $regex: new RegExp(`^${item.name.trim()}$`, 'i') },
      });

      if (existing) {
        existing.price = Number(item.price);
        if (item.category) existing.category = item.category;
        if (item.unit) existing.unit = item.unit;
        if (item.image) existing.image = item.image;
        if (item.stock !== undefined) existing.stock = Number(item.stock);
        if (item.originalPrice) existing.originalPrice = Number(item.originalPrice);
        existing.shopName = shopName;
        await existing.save();
        syncedProducts.push(existing);
      } else {
        const created = await Product.create({
          name: item.name.trim(),
          category: item.category?.trim() || 'General',
          unit: item.unit?.trim() || '1 unit',
          price: Number(item.price),
          originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
          image: item.image?.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
          stock: item.stock !== undefined ? Number(item.stock) : 50,
          shopId: req.user._id,
          shopName,
          isAvailable: true,
        });
        syncedProducts.push(created);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully synced ${syncedProducts.length} products to database`,
      data: syncedProducts,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Update an existing product (Owner only)
export const updateProduct = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const { name, category, unit, price, originalPrice, image, stock, isAvailable } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.shopId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new AppError('You do not have permission to update this product', 403);
    }

    if (name) product.name = name.trim();
    if (category) product.category = category.trim();
    if (unit) product.unit = unit.trim();
    if (price !== undefined) product.price = Number(price);
    if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
    if (image) product.image = image.trim();
    if (stock !== undefined) product.stock = Number(stock);
    if (isAvailable !== undefined) product.isAvailable = Boolean(isAvailable);

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// 6. Delete a product (Owner only)
export const deleteProduct = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.shopId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new AppError('You do not have permission to delete this product', 403);
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

