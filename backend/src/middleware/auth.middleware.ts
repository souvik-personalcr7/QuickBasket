import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUser, UserRole } from '../models/User';
import { AppError } from '../utils/appError';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface JwtPayload {
  id: string;
  role: UserRole;
  email: string;
  isActive?: boolean;
  isApproved?: boolean;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Check HTTP-only cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } 
    // 2. Check Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    // 3. Verify JWT
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // 4. Find user in database
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError('The user belonging to this token no longer exists.', 401);
    }
    if (!user.isActive) {
      throw new AppError('This account has been suspended or deactivated.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token. Please log in again.', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Your session has expired. Please log in again.', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('You must be logged in to perform this action.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
          403
        )
      );
    }

    next();
  };
};

export const requireActive = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }
  if (!req.user.isActive) {
    return next(new AppError('This account has been suspended or deactivated.', 403));
  }
  next();
};

export const requireApproved = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }
  if (req.user.role === 'shop_owner' && req.user.shopDetails?.isApproved === false) {
    return next(
      new AppError(
        'Your shop owner account is pending administrator approval. Protected storefront operations are locked.',
        403
      )
    );
  }
  if (req.user.role === 'delivery_partner' && req.user.deliveryDetails?.isApproved === false) {
    return next(
      new AppError(
        'Your delivery partner account is pending administrator approval. Active delivery operations are locked.',
        403
      )
    );
  }
  next();
};
