import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Coupon from '@/model/Coupon';

// Utility to extract IP from request headers
function getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0]; // Use the first IP in the list
    }

    return req.headers.get('cf-connecting-ip') || // Cloudflare
        req.headers.get('x-real-ip') || // Nginx or other proxies
        'unknown';
}

// Constants
const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hour in milliseconds

export async function POST(req: NextRequest) {
    try {
        // Connect to the database
        await connectToDatabase();

        // Extract client IP
        const clientIP = getClientIP(req);

        // Step 1: Check for recent claims by this IP
        const recentClaim = await Coupon.findOne({
            claimedBy: clientIP,
            claimedAt: { $gte: new Date(Date.now() - ONE_HOUR_MS) },
        }).sort({ claimedAt: -1 }); // Get the most recent claim

        if (recentClaim) {
            const lastClaimedAt = recentClaim.claimedAt as Date;
            const nextClaimTime = new Date(lastClaimedAt.getTime() + ONE_HOUR_MS);
            const timeRemaining = nextClaimTime.getTime() - Date.now();

            return NextResponse.json(
                {
                    success: false,
                    message: `You can claim again at ${nextClaimTime.toLocaleTimeString()}`,
                    nextClaimTime: nextClaimTime.toISOString(),
                },
                { status: 429 } // Too Many Requests
            );
        }

        // Step 2: Find and claim the first unclaimed coupon
        const coupon = await Coupon.findOneAndUpdate(
            { isClaimed: false },
            {
                $set: {
                    isClaimed: true,
                    claimedBy: clientIP,
                    claimedAt: new Date(),
                },
            },
            { new: true, sort: { _id: 1 } } // Sort by _id for round-robin order
        );

        if (!coupon) {
            return NextResponse.json(
                { success: false, message: 'All coupons have been claimed' },
                { status: 410 } // Gone
            );
        }

        // Step 3: Set a cookie for client-side tracking
        const nextClaimTime = new Date(Date.now() + ONE_HOUR_MS);
        const response = NextResponse.json({
            success: true,
            coupon: coupon.code,
            claimedAt: coupon.claimedAt.toISOString(),
        });

        response.cookies.set({
            name: 'nextClaimTime',
            value: nextClaimTime.toISOString(),
            expires: nextClaimTime,
            httpOnly: true, // Prevent client-side JS access
            secure: process.env.NODE_ENV === 'production', // Secure in production
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Error in /api/claim:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}