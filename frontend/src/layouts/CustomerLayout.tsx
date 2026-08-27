import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { fetchWishlist } from '../redux/slices/wishlistSlice';
import { fetchCart } from '../redux/slices/cartSlice';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ToasterContainer } from '../components/Toast';

export const CustomerLayout: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist());
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 transition-colors duration-200 dark:bg-gray-950 dark:text-gray-100">
      <ToasterContainer />
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default CustomerLayout;
