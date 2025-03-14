import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Coupon from '@/model/Coupon';

export async function GET() {
  try {
    await connectToDatabase();
    const totalCoupons = await Coupon.countDocuments();
    const claimedCoupons = await Coupon.countDocuments({ isClaimed: true });
    return NextResponse.json({
      success: true,
      totalCoupons,
      claimedCoupons,
    });
  } catch (error) {
    console.error('Error in /api/stats:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}