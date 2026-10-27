import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CustomerLayout, AdminLayout, AuthLayout } from '../layouts';
import {
  Home,
  Shop,
  Cart,
  Login,
  Register,
  NotFound,
  CategoriesPage,
  ProductDetails,
  SearchPage,
  WishlistPage,
  Checkout,
  OrderSuccess,
  MyOrders,
  ProfilePage,
  ForgotPassword,
  ResetPassword,
} from '../pages';
import {
  AdminDashboardPage,
  AdminProducts,
  AdminAddProduct,
  AdminEditProduct,
  AdminCategories,
  AdminBrands,
  AdminOrders,
  AdminOrderStatus,
  AdminCustomers,
  AdminCoupons,
  AdminReviews,
  AdminSettings,
} from '../pages/admin';
import ProtectedRoute from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Customer Routes */}
      <Route path="/" element={<CustomerLayout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="product/:id" element={<ProductDetails />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="cart" element={<Cart />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order-success" element={<OrderSuccess />} />
        <Route path="orders" element={<MyOrders />} />
        <Route
          path="profile"
          element={
            <ProtectedRoute allowedRoles={['customer', 'admin']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/add" element={<AdminAddProduct />} />
        <Route path="products/edit/:id" element={<AdminEditProduct />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="brands" element={<AdminBrands />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="order-status" element={<AdminOrderStatus />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
