import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'souvikdas_quickbasket';
const JWT_EXPIRES_IN = '365d';

export interface TokenPayload {
  id: string;
  role: string;
  email: string;
  isActive?: boolean;
}

export function signToken(user: { id?: string; _id?: any; role: string; email: string; isActive?: boolean }): string {
  const userId = user.id || (user._id ? user._id.toString() : '');
  return jwt.sign(
    {
      id: userId,
      role: user.role,
      email: user.email,
      isActive: user.isActive ?? true,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function getUserFromRequest(req: NextRequest | Request): TokenPayload | null {
  // Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const payload = verifyToken(token);
    if (payload) return payload;
  }

  // Check Cookie header
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  if (match && match[1]) {
    const payload = verifyToken(match[1]);
    if (payload) return payload;
  }

  return null;
}

