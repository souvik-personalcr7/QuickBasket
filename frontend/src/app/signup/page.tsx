"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  Store,
  Bike,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Building2,
  Truck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/auth";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    register,
    getRoleRedirectPath,
    isAuthenticated,
    role: currentRole,
  } = useAuth();

  // Selected role state
  const [selectedRole, setSelectedRole] = useState<UserRole>("customer");

  // Form input state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Customer address
    street: "",
    city: "",
    postalCode: "",
    // Shop details
    shopName: "",
    category: "Grocery & Staples",
    shopAddress: "",
    // Delivery details
    vehicleType: "Motorcycle / Scooter",
    vehicleNumber: "",
    deliveryCity: "",
    termsAccepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync role from query string if available
  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (
      roleParam === "customer" ||
      roleParam === "shop_owner" ||
      roleParam === "delivery_partner"
    ) {
      setSelectedRole(roleParam as UserRole);
    }
  }, [searchParams]);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && currentRole) {
      router.push(getRoleRedirectPath(currentRole));
    }
  }, [isAuthenticated, currentRole, router, getRoleRedirectPath]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!formData.name.trim()) {
      setErrorMsg("Please enter your full name");
      return;
    }
    if (!formData.email.trim()) {
      setErrorMsg("Please enter your email address");
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg("Please enter your contact phone number");
      return;
    }
    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }
    if (!formData.termsAccepted) {
      setErrorMsg(
        "Please agree to the QuickBasket Terms of Service and Privacy Policy",
      );
      return;
    }

    if (selectedRole === "shop_owner" && !formData.shopName.trim()) {
      setErrorMsg("Please enter your shop or store name");
      return;
    }

    if (selectedRole === "delivery_partner" && !formData.deliveryCity.trim()) {
      setErrorMsg("Please specify your operational delivery city / zone");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: selectedRole,
        address:
          selectedRole === "customer"
            ? {
                street: formData.street,
                city: formData.city,
                postalCode: formData.postalCode,
              }
            : undefined,
        shopDetails:
          selectedRole === "shop_owner"
            ? {
                shopName: formData.shopName.trim(),
                category: formData.category,
                address: formData.shopAddress.trim(),
              }
            : undefined,
        deliveryDetails:
          selectedRole === "delivery_partner"
            ? {
                vehicleType: formData.vehicleType,
                vehicleNumber: formData.vehicleNumber.trim(),
                city: formData.deliveryCity.trim(),
              }
            : undefined,
      });

      if (res.success && res.role) {
        if (selectedRole === "shop_owner") {
          try {
            const rawShops = localStorage.getItem("qb_registered_shops");
            const shopsList = rawShops ? JSON.parse(rawShops) : [];
            const newShop = {
              id: `shop_${Date.now()}`,
              name: formData.shopName.trim() || `${formData.name}'s Store`,
              category: formData.category || "Retail & Grocery",
              address: formData.shopAddress.trim() || formData.city || "Store Address",
              ownerName: formData.name.trim(),
              ownerEmail: formData.email.trim(),
              rating: 4.8,
              reviewCount: "New Store",
              deliveryTime: "20-30 mins",
              isFreeDelivery: true,
              productCount: 0,
              image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=350&auto=format&fit=crop&q=80",
            };
            shopsList.push(newShop);
            localStorage.setItem("qb_registered_shops", JSON.stringify(shopsList));
          } catch (e) {
            console.error("Failed to save registered shop:", e);
          }
        }
        router.push(getRoleRedirectPath(res.role));
      } else {
        setErrorMsg(
          res.message ||
            "Failed to create account. Please check your information.",
        );
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleConfigs = [
    {
      id: "customer" as UserRole,
      title: "Customer",
      tagline: "Order Groceries & Produce",
      badge: "Fast Delivery",
      icon: ShoppingBag,
      accent: "border-emerald-500 bg-emerald-50/50 text-emerald-900",
      activeRing: "ring-2 ring-emerald-600",
      iconBg: "bg-emerald-600 text-white",
    },
    {
      id: "shop_owner" as UserRole,
      title: "Shop Owner",
      tagline: "Sell & Manage Local Store",
      badge: "Multi-Vendor",
      icon: Store,
      accent: "border-amber-500 bg-amber-50/50 text-amber-900",
      activeRing: "ring-2 ring-amber-600",
      iconBg: "bg-amber-600 text-white",
    },
    {
      id: "delivery_partner" as UserRole,
      title: "Delivery Partner",
      tagline: "Flexible Shifts & Quick Payouts",
      badge: "Hyperlocal Fleet",
      icon: Bike,
      accent: "border-blue-500 bg-blue-50/50 text-blue-900",
      activeRing: "ring-2 ring-blue-600",
      iconBg: "bg-blue-600 text-white",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-3xl">
        {/* Header Header Brand Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-200 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Join 50,000+ Happy Customers, Stores & Riders</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Create Your <span className="text-[#15803d]">QuickBasket</span>{" "}
            Account
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-md mx-auto">
            Choose your role below to get personalized access to groceries,
            store management, or delivery workflows.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-10 backdrop-blur-sm">
          {/* Step 1: Role Selector Tabs */}
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Step 1: Select Your Role
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {roleConfigs.map((r) => {
                const isSelected = selectedRole === r.id;
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r.id);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? `${r.accent} ${r.activeRing} shadow-md`
                        : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 text-emerald-600">
                        <CheckCircle2 className="w-5 h-5 fill-emerald-600 text-white" />
                      </span>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${isSelected ? r.iconBg : "bg-slate-200 text-slate-700"}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs uppercase font-extrabold tracking-wider opacity-75">
                          {r.badge}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                          {r.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {r.tagline}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Step 2: Basic Information
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {selectedRole === "shop_owner"
                      ? "Owner / Merchant Name"
                      : "Full Name"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={
                        selectedRole === "shop_owner"
                          ? "e.g. Ramesh Patel"
                          : "e.g. Rahul Sharma"
                      }
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. user@quickbasket.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mobile Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. 9876543210 (10-digit number)"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat your password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <span
                      className={`text-[10px] mt-1 block font-medium ${
                        formData.password === formData.confirmPassword
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}
                    >
                      {formData.password === formData.confirmPassword
                        ? "✓ Passwords match"
                        : "✗ Passwords do not match"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Role Specific Details */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Step 3:{" "}
                {selectedRole === "customer"
                  ? "Delivery Address (Optional)"
                  : selectedRole === "shop_owner"
                    ? "Store & Retail Details"
                    : "Fleet & Dispatch Details"}
              </label>

              {/* Customer Fields */}
              {selectedRole === "customer" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/70">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Street Address / Flat No.
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        placeholder="e.g. Flat 402, Sunshine Residency, Main Road"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Mumbai, Delhi, Bengaluru"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PIN / Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="e.g. 560001"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Shop Owner Fields */}
              {selectedRole === "shop_owner" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-amber-50/30 p-4 rounded-2xl border border-amber-100">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Shop / Mart Name{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="shopName"
                        required={selectedRole === "shop_owner"}
                        value={formData.shopName}
                        onChange={handleChange}
                        placeholder="e.g. Kisan Fresh Organic & Daily Mart"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Primary Store Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option>Grocery & Staples</option>
                      <option>Fresh Fruits & Vegetables</option>
                      <option>Dairy, Eggs & Bakery</option>
                      <option>Snacks & Beverages</option>
                      <option>Personal Care & Household</option>
                      <option>Organic & Gourmet Goods</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Store / Market Location
                    </label>
                    <input
                      type="text"
                      name="shopAddress"
                      value={formData.shopAddress}
                      onChange={handleChange}
                      placeholder="e.g. Shop #14, Sector 7 Market"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Delivery Partner Fields */}
              {selectedRole === "delivery_partner" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-blue-50/30 p-4 rounded-2xl border border-blue-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Vehicle Type
                    </label>
                    <div className="relative">
                      <Truck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option>Bicycle</option>
                        <option>Motorcycle / Scooter</option>
                        <option>Electric Scooter (EV)</option>
                        <option>Car / Delivery Van</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Vehicle Registration No.
                    </label>
                    <input
                      type="text"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      placeholder="e.g. MH 02 AB 1234 (optional for cycle)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Operational City / Zone{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="deliveryCity"
                      required={selectedRole === "delivery_partner"}
                      value={formData.deliveryCity}
                      onChange={handleChange}
                      placeholder="e.g. South Delhi / Indiranagar"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-600 leading-normal">
                  I agree to QuickBasket&apos;s{" "}
                  <a
                    href="#terms"
                    className="text-emerald-700 font-semibold underline hover:text-emerald-800"
                  >
                    Terms of Service
                  </a>
                  ,{" "}
                  <a
                    href="#privacy"
                    className="text-emerald-700 font-semibold underline hover:text-emerald-800"
                  >
                    Privacy Policy
                  </a>{" "}
                  and Hyperlocal Operating Guidelines for{" "}
                  {selectedRole.replace("_", " ")}s.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#0f5132] hover:bg-[#166534] active:bg-[#14532d] text-white font-bold text-sm shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:ring-offset-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Creating Your Account...</span>
                </>
              ) : (
                <>
                  <span>
                    Complete Registration as{" "}
                    {selectedRole === "shop_owner"
                      ? "Shop Owner"
                      : selectedRole === "delivery_partner"
                        ? "Delivery Partner"
                        : "Customer"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Switch to Login */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>256-bit encrypted & secure authentication</span>
            </div>

            <div>
              <span>Already have an account? </span>
              <Link
                href={`/login?role=${selectedRole}`}
                className="text-emerald-700 font-bold hover:underline ml-1"
              >
                Log In here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
