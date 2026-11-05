import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUser } from '../models/User';
import { registerSchema, loginSchema, updateAddressSchema, updateShopDetailsSchema } from '../validators/auth.validator';
import { AppError } from '../utils/appError';
import { sendResponse } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Helper to sign JWT
export const signToken = (user: IUser): string => {
  const isApproved =
    user.role === 'shop_owner'
      ? Boolean(user.shopDetails?.isApproved)
      : user.role === 'delivery_partner'
      ? Boolean(user.deliveryDetails?.isApproved ?? true)
      : true;

  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      isActive: user.isActive,
      isApproved,
    },
    env.JWT_SECRET,
    {
      expiresIn: (env.JWT_EXPIRES_IN || '365d') as jwt.SignOptions['expiresIn'],
    }
  );
};

// Helper to set cookie
const setAuthCookie = (res: Response, token: string): void => {
  const isProduction = env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 365 * 24 * 60 * 60 * 1000, // Persistent session (1 year)
    path: '/',
  });
};


export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Validate payload
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      throw new AppError(errorMsg, 400);
    }

    const { name, email, phone, password, role, address, shopDetails, deliveryDetails, avatar } = parsed.data;

    // 2. Check existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    // 3. Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: role || 'customer',
      avatar: avatar || '',
      address: address || {},
      shopDetails: role === 'shop_owner' ? shopDetails : undefined,
      deliveryDetails: role === 'delivery_partner' ? deliveryDetails : undefined,
    });

    await user.save();

    // 4. Generate token & set cookie
    const token = signToken(user);
    setAuthCookie(res, token);

    // 5. Send response
    sendResponse(res, {
      statusCode: 201,
      message: 'Account created successfully',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Validate payload
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      throw new AppError(errorMsg, 400);
    }

    const { email, password, role } = parsed.data;

    // 2. Find user with password included
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    // 3. Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new AppError('Invalid email or password.', 401);
    }

    // 4. Optional role check for portal mismatch warnings
    if (role && user.role !== role) {
      const friendlyRoleNames: Record<string, string> = {
        customer: 'Customer',
        shop_owner: 'Shop Owner',
        delivery_partner: 'Delivery Partner',
        admin: 'Administrator',
      };
      throw new AppError(
        `This account is registered as a ${friendlyRoleNames[user.role] || user.role}. Please select the ${friendlyRoleNames[user.role]} role tab to log in.`,
        403
      );
    }

    if (!user.isActive) {
      throw new AppError('This account has been deactivated. Please contact support.', 403);
    }

    // 5. Sign token & set cookie
    const token = signToken(user);
    setAuthCookie(res, token);

    // Don't leak password in response
    user.password = undefined;

    sendResponse(res, {
      statusCode: 200,
      message: 'Logged in successfully',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    sendResponse(res, {
      statusCode: 200,
      message: 'User profile retrieved',
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });

    sendResponse(res, {
      statusCode: 200,
      message: 'Logged out successfully',
      data: null,
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
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const parsed = updateAddressSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      throw new AppError(errorMsg, 400);
    }

    const { street, city, state, postalCode } = parsed.data;

    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.address = {
      street: street !== undefined ? street.trim() : (user.address?.street || ''),
      city: city !== undefined ? city.trim() : (user.address?.city || ''),
      state: state !== undefined ? state.trim() : (user.address?.state || ''),
      postalCode: postalCode !== undefined ? postalCode.trim() : (user.address?.postalCode || ''),
    };

    await user.save();
    user.password = undefined;

    sendResponse(res, {
      statusCode: 200,
      message: 'Primary address updated successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateShopDetails = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    if (req.user.role !== 'shop_owner' && req.user.role !== 'admin') {
      throw new AppError('Access denied. Only shop owners can manage storefront details.', 403);
    }

    if (!req.user.isActive) {
      throw new AppError('This account has been deactivated or suspended.', 403);
    }

    const parsed = updateShopDetailsSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
      throw new AppError(errorMsg, 400);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const current = user.shopDetails || {};
    user.shopDetails = {
      shopName: parsed.data.shopName !== undefined ? parsed.data.shopName.trim() : (current.shopName || ''),
      category: parsed.data.category !== undefined ? parsed.data.category.trim() : (current.category || 'General Store'),
      address: parsed.data.address !== undefined ? parsed.data.address.trim() : (current.address || ''),
      image: parsed.data.image !== undefined ? parsed.data.image.trim() : (current.image || ''),
      isApproved: current.isApproved !== undefined ? current.isApproved : false,
    };

    await user.save();
    user.password = undefined;

    sendResponse(res, {
      statusCode: 200,
      message: 'Storefront details updated successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};
