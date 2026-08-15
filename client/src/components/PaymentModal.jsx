import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, ShieldCheck, Lock, X } from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import paymentService from '../services/paymentService';
import useAuth from '../hooks/useAuth';

// Helper to load external Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PaymentModal = ({ isOpen, onClose, booking, onSuccess, onFailure }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [simulatingTest, setSimulatingTest] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !booking) return null;

  const handleStartPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Create Order via Server Authority
      const orderRes = await paymentService.createOrder(booking._id);
      const { orderId, amountInSubunits, amount, currency, keyId } = orderRes.data;

      // 2. Attempt loading Razorpay Checkout script
      const isScriptLoaded = await loadRazorpayScript();

      if (isScriptLoaded && window.Razorpay && keyId && !keyId.includes('rzp_test_nestly_dev_key')) {
        // Real Razorpay Checkout Modal
        const options = {
          key: keyId,
          amount: amountInSubunits,
          currency: currency || 'INR',
          name: 'Nestly Hotels & Stays',
          description: `Reservation Payment for ${booking.bookingReference}`,
          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=120',
          order_id: orderId,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#1e293b',
          },
          handler: async (response) => {
            try {
              const verifyRes = await paymentService.verifyPayment({
                bookingId: booking._id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              onSuccess(verifyRes);
            } catch (err) {
              setError(err.message || 'Payment signature verification failed');
              if (onFailure) onFailure(err);
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Test Mode Simulation Sandbox Dialog
        setSimulatingTest(true);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate payment order');
      setLoading(false);
    }
  };

  const handleSimulatedTestPayment = async (shouldSucceed = true) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch or re-create Order
      const orderRes = await paymentService.createOrder(booking._id);
      const { orderId } = orderRes.data;

      if (!shouldSucceed) {
        setError('Payment was declined by card issuer (Simulated Test)');
        setLoading(false);
        return;
      }

      const mockPaymentId = `pay_simulated_${Date.now()}`;
      const mockSignature = `simulated_success_sig_${orderId}`;

      const verifyRes = await paymentService.verifyPayment({
        bookingId: booking._id,
        razorpayOrderId: orderId,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: mockSignature,
      });

      onSuccess(verifyRes);
    } catch (err) {
      setError(err.message || 'Failed to process test payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative my-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Online Checkout</h3>
              <p className="text-xs text-slate-500">Ref: {booking.bookingReference}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Details */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Property</span>
            <span className="font-semibold text-slate-900">{booking.hotel?.name || 'Hotel'}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Guest</span>
            <span className="font-semibold text-slate-900">{user?.name}</span>
          </div>
          <div className="flex justify-between font-extrabold text-slate-900 text-sm pt-2 border-t border-slate-200">
            <span>Total Payable Amount</span>
            <span className="text-blue-700">{formatPrice(booking.totalAmount)}</span>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>256-Bit SSL Encrypted & HMAC Signature Verification</span>
        </div>

        {/* Modal Buttons */}
        {!simulatingTest ? (
          <button
            onClick={handleStartPayment}
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-75"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? 'Initializing Secure Order...' : `Pay ${formatPrice(booking.totalAmount)} Now`}</span>
          </button>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
              <strong>Dev Test Mode Active:</strong> Standard Razorpay keys are unconfigured. Choose a test payment outcome below:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSimulatedTestPayment(true)}
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Simulate Success
              </button>
              <button
                onClick={() => handleSimulatedTestPayment(false)}
                disabled={loading}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Simulate Failure
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentModal;
