import { Router } from 'express';
import { getShops, getShopById } from '../controllers/shop.controller';

const router = Router();

// Public: Browse all registered shops
router.get('/', getShops);

// Public: Get a specific shop with its products
router.get('/:id', getShopById);

export const shopRoutes = router;

