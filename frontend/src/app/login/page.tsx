 'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingBag,
  Store,
  Bike,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';
import { evaluateRouteAccess } from '@/lib/rbac';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, getRoleRedirectPath, isAuthenticated, role: currentRole } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync role or errors from query parameters if present
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'customer' || roleParam === 'shop_owner' || roleParam === 'delivery_partner') {
      setSelectedRole(roleParam as UserRole);
    }
    const errorParam = searchParams.get('error');
    if (errorParam === 'session_expired') {
      setErrorMsg('Your session has expired. Please log in again to continue.');
    } else if (errorParam === 'account_deactivated') {
      setErrorMsg('This account has been deactivated or suspended. Please contact support.');
    }
  }, [searchParams]);

  // If already logged in, redirect to destination safely
  useEffect(() => {
    if (isAuthenticated && currentRole) {
      const redirectParam = searchParams.get('redirect');
      if (redirectParam && redirectParam.startsWith('/')) {
        if (redirectParam === '/' && currentRole !== 'customer') {
          router.replace(getRoleRedirectPath(currentRole));
          return;
        }
        const evalRes = evaluateRouteAccess(redirectParam, { id: '', role: currentRole, email: '' });
        if (evalRes.action === 'allow') {
          router.replace(redirectParam);
          return;
        }
      }
      router.replace(getRoleRedirectPath(currentRole));
    }
  }, [isAuthenticated, currentRole, router, getRoleRedirectPath, searchParams]);

  // Quick Demo fill credentials
  const fillDemoCredentials = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
    if (role === 'customer') {
      setEmail('demo@quickbasket.com');
      setPassword('password123');
    } else if (role === 'shop_owner') {
      setEmail('owner@quickbasket.com');
      setPassword('password123');
    } else if (role === 'delivery_partner') {
      setEmail('rider@quickbasket.com');
      setPassword('password123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your email address');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await login({
        email: email.trim(),
        password,
        role: selectedRole,
      });

      if (res.success && res.role) {
        const redirectParam = searchParams.get('redirect');
        if (redirectParam && redirectParam.startsWith('/')) {
          if (redirectParam === '/' && res.role !== 'customer') {
            router.push(getRoleRedirectPath(res.role));
            return;
          }
          const evalRes = evaluateRouteAccess(redirectParam, { id: '', role: res.role, email: '' });
          if (evalRes.action === 'allow') {
            router.push(redirectParam);
            return;
          }
        }
        router.push(getRoleRedirectPath(res.role));
      } else {
        setErrorMsg(res.message || 'Login failed. Please verify your credentials.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred during login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleDetails = {
    customer: {
      title: 'Customer',
      description: 'Access fresh groceries, order tracking & hyperlocal daily delivery.',
      badge: 'Shopper Portal',
      icon: ShoppingBag,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      activeTab: 'bg-white text-emerald-800 shadow-sm border border-emerald-200',
      fillBtn: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200',
    },
    shop_owner: {
      title: 'Shop Owner',
      description: 'Manage store catalog, inventory stocks, prices & incoming customer orders.',
      badge: 'Merchant Portal',
      icon: Store,
      color: 'text-amber-800 bg-amber-50 border-amber-200',
      activeTab: 'bg-white text-amber-800 shadow-sm border border-amber-200',
      fillBtn: 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200',
    },
    delivery_partner: {
      title: 'Delivery Partner',
      description: 'Rider dispatch board, real-time routing, active deliveries & payout stats.',
      badge: 'Rider Fleet',
      icon: Bike,
      color: 'text-blue-800 bg-blue-50 border-blue-200',
      activeTab: 'bg-white text-blue-800 shadow-sm border border-blue-200',
      fillBtn: 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200',
    },
    admin: {
      title: 'Admin',
      description: 'Platform governance and operational metrics.',
      badge: 'Admin Console',
      icon: ShieldCheck,
      color: 'text-purple-800 bg-purple-50 border-purple-200',
      activeTab: 'bg-white text-purple-800 shadow-sm border border-purple-200',
      fillBtn: 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200',
    },
  };

  const currentRoleInfo = roleDetails[selectedRole];
  const RoleIcon = currentRoleInfo.icon;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Secure Role-Based Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome Back to <span className="text-[#15803d]">QuickBasket</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Sign in to access your customized role dashboard.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8 backdrop-blur-sm">
          {/* Role Navigation Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('customer');
                  if (errorMsg) setErrorMsg(null);
                }}
                className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  selectedRole === 'customer'
                    ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="whitespace-nowrap">Customer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('shop_owner');
                  if (errorMsg) setErrorMsg(null);
                }}
                className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  selectedRole === 'shop_owner'
                    ? 'bg-white text-amber-800 shadow-sm border border-amber-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="whitespace-nowrap">Shop Owner</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('delivery_partner');
                  if (errorMsg) setErrorMsg(null);
                }}
                className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  selectedRole === 'delivery_partner'
                    ? 'bg-white text-blue-800 shadow-sm border border-blue-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bike className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="whitespace-nowrap">Delivery</span>
              </button>
            </div>
          </div>

          {/* Role Context Notification */}
          <div className={`mb-6 p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${currentRoleInfo.color}`}>
            <div className="p-2 rounded-xl bg-white/80 shadow-xs shrink-0">
              <RoleIcon className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <span className="font-bold whitespace-nowrap">{currentRoleInfo.title} Mode:</span>{' '}
              <span className="opacity-90">{currentRoleInfo.description}</span>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="your.email@quickbasket.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  href={`/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0f5132] hover:bg-[#166534] active:bg-[#14532d] text-white font-bold text-sm shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:ring-offset-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {currentRoleInfo.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Login Box */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Instant 1-Click Demo Logins</span>
            </div>
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('customer')}
                className="py-1.5 px-1 sm:px-2 rounded-lg text-[10px] sm:text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors whitespace-nowrap shrink-0 text-center cursor-pointer"
                title="Customer: demo@quickbasket.com / password123"
              >
                <span className="whitespace-nowrap">Customer</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('shop_owner')}
                className="py-1.5 px-1 sm:px-2 rounded-lg text-[10px] sm:text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors whitespace-nowrap shrink-0 text-center cursor-pointer"
                title="Shop Owner: owner@quickbasket.com / password123"
              >
                <span className="whitespace-nowrap">Shop Owner</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('delivery_partner')}
                className="py-1.5 px-1 sm:px-2 rounded-lg text-[10px] sm:text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-colors whitespace-nowrap shrink-0 text-center cursor-pointer"
                title="Delivery Partner: rider@quickbasket.com / password123"
              >
                <span className="whitespace-nowrap">Rider Partner</span>
              </button>
            </div>
          </div>

          {/* Bottom Card Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-xs text-slate-500">
            <div>
              <span>Don&apos;t have an account? </span>
              <Link
                href={`/signup?role=${selectedRole}`}
                className="text-emerald-700 font-bold hover:underline"
              >
                Sign up as {currentRoleInfo.title}
              </Link>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Role-Based Access Control Enforced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
