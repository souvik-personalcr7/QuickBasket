import { Router } from 'express';
import {
  getProducts,
  getMyShopProducts,
  createProduct,
  bulkSyncProducts,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public: Browse all products or filter by shop/category/search
router.get('/', getProducts);

// Shop Owner: Get my own store products
router.get('/my-shop', authenticate, authorize('shop_owner', 'admin'), getMyShopProducts);

// Shop Owner: Create a new product
router.post('/', authenticate, authorize('shop_owner', 'admin'), createProduct);

// Shop Owner: Bulk sync existing localStorage products to MongoDB
router.post('/bulk-sync', authenticate, authorize('shop_owner', 'admin'), bulkSyncProducts);

// Shop Owner: Update a product
router.put('/:id', authenticate, authorize('shop_owner', 'admin'), updateProduct);

// Shop Owner: Delete a product
router.delete('/:id', authenticate, authorize('shop_owner', 'admin'), deleteProduct);

export const productRoutes = router;

