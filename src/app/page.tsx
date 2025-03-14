'use client';
import { useState, useEffect } from 'react';

export default function ClaimPage() {
  const [coupon, setCoupon] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<{ totalCoupons: number; claimedCoupons: number } | null>(null);

  // Utility to get cookie value
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  // Format time left into MM:SS
  const formatTimeLeft = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check restriction and fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) setStats(data);
    };

    const nextClaimCookie = getCookie('nextClaimTime');
    if (nextClaimCookie) {
      const nextClaim = new Date(nextClaimCookie);
      if (nextClaim > new Date()) {
        setNextClaimTime(nextClaim);
        setMessage(`You can claim again at ${nextClaim.toLocaleTimeString()}`);
      }
    }

    fetchStats();
  }, []);

  // Ticking timer
  useEffect(() => {
    if (!nextClaimTime || nextClaimTime <= new Date()) {
      setTimeLeft('');
      return;
    }

    const timer = setInterval(() => {
      const msLeft = nextClaimTime.getTime() - Date.now();
      if (msLeft <= 0) {
        setNextClaimTime(null);
        setMessage('');
        setTimeLeft('');
        clearInterval(timer);
      } else {
        setTimeLeft(formatTimeLeft(msLeft));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextClaimTime]);

  // Handle coupon claim
  const handleClaim = async () => {
    setIsLoading(true);
    setMessage('');
    setCoupon(null);

    try {
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        setCoupon(data.coupon);
        setMessage('Coupon claimed successfully!');
        setNextClaimTime(new Date(data.claimedAt));
        // Refresh stats
        const statsRes = await fetch('/api/stats');
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData);
      } else {
        if (data.nextClaimTime) {
          const nextClaim = new Date(data.nextClaimTime);
          setNextClaimTime(nextClaim);
          setMessage(`You can claim again at ${nextClaim.toLocaleTimeString()}`);
        } else {
          setMessage(data.message);
        }
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
      console.error('Claim error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
            Coupon Distribution Hub
          </h1>
          <p className="text-lg text-gray-600">
            Claim exclusive coupons in a fair, round-robin system. One claim per hour per user.
          </p>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Claim Section */}
          <div className="flex flex-col justify-between bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Claim a Coupon</h2>

            {/* Message */}
            {message && (
              <div
                className={`p-4 mb-4 rounded-lg text-center font-medium ${
                  coupon
                    ? 'bg-green-100 text-green-800 border-l-4 border-green-500'
                    : message.includes('again')
                    ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500'
                    : 'bg-red-100 text-red-800 border-l-4 border-red-500'
                }`}
              >
                {message}
                {timeLeft && (
                  <p className="mt-2 text-lg font-semibold">
                    Time Left: <span className="text-black">{timeLeft}</span>
                  </p>
                )}
              </div>
            )}

            {/* Coupon Display */}
            {coupon && (
              <div className="mb-4 text-center">
                <p className="text-lg font-semibold text-gray-700">Your Coupon:</p>
                <p className="text-2xl font-bold text-blue-600 mt-2 bg-blue-50 py-2 px-4 rounded-md">
                  {coupon}
                </p>
              </div>
            )}

            {/* Claim Button */}
            <button
              onClick={handleClaim}
              disabled={isLoading || !!nextClaimTime}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white flex items-center justify-center transition-all duration-200 ${
                isLoading || nextClaimTime
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8h8a8 8 0 11-16 0z"
                    />
                  </svg>
                  Claiming...
                </>
              ) : (
                'Claim Coupon'
              )}
            </button>
          </div>

          {/* Stats Section */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Coupon Stats</h2>
            {stats ? (
              <div className="space-y-4">
                <p className="text-lg text-gray-700">
                  <span className="font-semibold">Total Coupons:</span> {stats.totalCoupons}
                </p>
                <p className="text-lg text-gray-700">
                  <span className="font-semibold">Claimed:</span> {stats.claimedCoupons}
                </p>
                <p className="text-lg text-gray-700">
                  <span className="font-semibold">Available:</span>{' '}
                  {stats.totalCoupons - stats.claimedCoupons}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">Loading stats...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}