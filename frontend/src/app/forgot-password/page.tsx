'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

type ResetStep = 'EMAIL' | 'OTP' | 'NEW_PASSWORD' | 'SUCCESS';

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<ResetStep>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Resend cooldown timer in seconds
  const [resendCooldown, setResendCooldown] = useState(0);

  // References for the 6 OTP input elements
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Prepopulate email from query parameter if provided
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam.trim());
    }
  }, [searchParams]);

  // Handle countdown timer for Resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus the first OTP input when switching to OTP step
  useEffect(() => {
    if (step === 'OTP') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // 1. Submit Email -> Request OTP
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiClient<{ email: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail }),
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Verification code sent to your email.');
        setStep('OTP');
        setResendCooldown(60); // 60 seconds cooldown
      } else {
        setErrorMsg(res.message || 'Unable to process request. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle individual OTP input changes and auto-focusing
  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, ''); // Digits only

    if (!cleanVal) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    // If user pasted multi-digit string
    if (cleanVal.length > 1) {
      const digits = cleanVal.slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) {
          newOtp[index + i] = d;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    // Single digit entry
    const newOtp = [...otp];
    newOtp[index] = cleanVal;
    setOtp(newOtp);

    // Auto-advance focus to next box
    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation between OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // 2. Submit OTP -> Verify Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const fullOtp = otp.join('').trim();
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of your verification code');
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiClient<{ verified: boolean }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: fullOtp,
        }),
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Code verified successfully.');
        setStep('NEW_PASSWORD');
      } else {
        setErrorMsg(res.message || 'Invalid or expired verification code.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Submit New Password -> Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter to confirm.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiClient<{ success: boolean }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.join('').trim(),
          newPassword,
        }),
      });

      if (res.success) {
        setStep('SUCCESS');
      } else {
        setErrorMsg(res.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Secure Password Recovery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Reset Your <span className="text-[#15803d]">Password</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
            {step === 'EMAIL' && 'Enter your account email to receive a secure one-time verification code.'}
            {step === 'OTP' && 'Check your email inbox for the 6-digit code and enter it below.'}
            {step === 'NEW_PASSWORD' && 'Create a strong, new password for your QuickBasket account.'}
            {step === 'SUCCESS' && 'Your password has been securely reset. You can now log in.'}
          </p>
        </div>

        {/* Progress Step Indicator */}
        {step !== 'SUCCESS' && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === 'EMAIL'
                  ? 'w-10 bg-emerald-600'
                  : 'w-4 bg-emerald-200'
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === 'OTP'
                  ? 'w-10 bg-emerald-600'
                  : step === 'NEW_PASSWORD'
                  ? 'w-4 bg-emerald-200'
                  : 'w-4 bg-slate-200'
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === 'NEW_PASSWORD' ? 'w-10 bg-emerald-600' : 'w-4 bg-slate-200'
              }`}
            />
          </div>
        )}

        {/* Main Form Card Container */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8 backdrop-blur-sm">
          {/* Global Error Banner */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && step !== 'SUCCESS' && (
            <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* STEP 1: EMAIL INPUT */}
          {step === 'EMAIL' && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  We will send a 6-digit one-time password (OTP) to this address.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-700 font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Remember your password? Back to Login</span>
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* Recipient summary banner */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-700 truncate">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('EMAIL');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-emerald-700 font-bold hover:underline shrink-0 ml-2"
                >
                  Change
                </button>
              </div>

              {/* 6-box OTP Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 text-center">
                  Enter 6-Digit Verification Code
                </label>
                <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onFocus={(e) => e.target.select()}
                      className="w-full h-12 text-center text-xl font-bold rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Resend OTP button & timer */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Didn&apos;t receive code?</span>
                {resendCooldown > 0 ? (
                  <span className="font-semibold text-slate-400">
                    Resend in <strong className="text-emerald-700">{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleRequestOtp()}
                    className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend Code</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('EMAIL');
                    setErrorMsg(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-700 font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Email Step</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 'NEW_PASSWORD' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="At least 6 characters"
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1.5 text-xs text-rose-600 font-medium">
                    Passwords do not match.
                  </p>
                )}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      newPassword.length >= 6 ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  />
                  <span>Minimum 6 characters long</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      newPassword && newPassword === confirmPassword ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  />
                  <span>Passwords match</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Reset Password & Secure Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 'SUCCESS' && (
            <div className="text-center py-4 space-y-5">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-60" />
                <div className="relative w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Password Updated!
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-xs mx-auto">
                  Your password has been reset successfully. You can now log into QuickBasket using your new credentials.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href={`/login${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all inline-flex items-center justify-center gap-2"
                >
                  <span>Proceed to Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer Security Badging */}
        <div className="mt-8 text-center text-xs text-slate-400 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>256-Bit SSL Encrypted</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
            <span>QuickBasket Security</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}

