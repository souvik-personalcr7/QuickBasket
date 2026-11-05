import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Address } from '../models/Address';
import { createAddressSchema, updateAddressSchema } from '../validators/address.validator';
import { AppError } from '../utils/appError';
import { sendResponse } from '../utils/apiResponse';

export const getAddresses = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });

    sendResponse(res, {
      statusCode: 200,
      message: 'Addresses retrieved successfully',
      data: { addresses },
    });
  } catch (error) {
    next(error);
  }
};

export const createAddress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const validationResult = createAddressSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        validationResult.error.errors.map((e) => e.message).join(', '),
        400
      );
    }

    const input = validationResult.data;

    // Check existing address count for this user
    const existingCount = await Address.countDocuments({ user: userId });
    // If user has no existing addresses, this one must be default
    const shouldBeDefault = existingCount === 0 || !!input.isDefault;

    if (shouldBeDefault) {
      await Address.updateMany({ user: userId }, { isDefault: false });
    }

    const newAddress = await Address.create({
      user: userId,
      receiverName: input.receiverName,
      phone: input.phone,
      house: input.house,
      street: input.street,
      landmark: input.landmark || '',
      label: input.label,
      location: {
        type: 'Point',
        coordinates: [input.longitude, input.latitude], // GeoJSON [lng, lat]
      },
      formattedAddress: input.formattedAddress || '',
      isDefault: shouldBeDefault,
    });

    sendResponse(res, {
      statusCode: 201,
      message: 'Address saved successfully',
      data: { address: newAddress },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = req.params;
    const validationResult = updateAddressSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        validationResult.error.errors.map((e) => e.message).join(', '),
        400
      );
    }

    const input = validationResult.data;

    // Verify ownership and existence
    const existing = await Address.findById(id);
    if (!existing) {
      throw new AppError('Address not found', 404);
    }
    if (existing.user.toString() !== userId.toString() && req.user?.role !== 'admin') {
      throw new AppError('Access denied. You are not authorized to modify this address.', 403);
    }
    const address = existing;

    if (input.isDefault) {
      await Address.updateMany({ user: userId, _id: { $ne: id } }, { isDefault: false });
      address.isDefault = true;
    }

    if (input.receiverName !== undefined) address.receiverName = input.receiverName;
    if (input.phone !== undefined) address.phone = input.phone;
    if (input.house !== undefined) address.house = input.house;
    if (input.street !== undefined) address.street = input.street;
    if (input.landmark !== undefined) address.landmark = input.landmark;
    if (input.label !== undefined) address.label = input.label;
    if (input.formattedAddress !== undefined) address.formattedAddress = input.formattedAddress;

    if (input.latitude !== undefined && input.longitude !== undefined) {
      address.location = {
        type: 'Point',
        coordinates: [input.longitude, input.latitude],
      };
    }

    await address.save();

    sendResponse(res, {
      statusCode: 200,
      message: 'Address updated successfully',
      data: { address },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = req.params;
    const existing = await Address.findById(id);
    if (!existing) {
      throw new AppError('Address not found', 404);
    }
    if (existing.user.toString() !== userId.toString() && req.user?.role !== 'admin') {
      throw new AppError('Access denied. You are not authorized to delete this address.', 403);
    }

    await Address.findByIdAndDelete(id);

    // If deleted address was default, promote the latest remaining address to default
    if (existing.isDefault) {
      const latestRemaining = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
      if (latestRemaining) {
        latestRemaining.isDefault = true;
        await latestRemaining.save();
      }
    }

    sendResponse(res, {
      statusCode: 200,
      message: 'Address deleted successfully',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};

export const setDefaultAddress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { id } = req.params;
    const existing = await Address.findById(id);
    if (!existing) {
      throw new AppError('Address not found', 404);
    }
    if (existing.user.toString() !== userId.toString() && req.user?.role !== 'admin') {
      throw new AppError('Access denied. You are not authorized to update this address.', 403);
    }
    const targetAddress = existing;

    // Unset all other defaults
    await Address.updateMany({ user: userId }, { isDefault: false });

    targetAddress.isDefault = true;
    await targetAddress.save();

    sendResponse(res, {
      statusCode: 200,
      message: 'Default address updated successfully',
      data: { address: targetAddress },
    });
  } catch (error) {
    next(error);
  }
};

