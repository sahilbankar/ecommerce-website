import { api } from './api';

export interface Coupon {
  _id?: string;
  id?: string;
  code: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountAmount: number;
  minPurchase?: number;
  expiresAt?: string;
  isActive?: boolean;
}

export const couponService = {
  /**
   * Fetch currently active promotional coupons.
   */
  async getActiveCoupons(): Promise<Coupon[]> {
    try {
      const response = await api.get('/coupons/active');
      return response.data?.data?.coupons || [];
    } catch {
      return [];
    }
  },
};

export default couponService;
