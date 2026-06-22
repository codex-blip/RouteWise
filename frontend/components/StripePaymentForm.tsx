import { useState, useCallback } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { StripeCardElementOptions } from '@stripe/stripe-js';

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

const CARD_ELEMENT_OPTIONS: StripeCardElementOptions = {
  style: {
    base: {
      color: '#1f2937',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#dc2626',
      iconColor: '#dc2626',
    },
  },
  hidePostalCode: true,
};

export default function StripePaymentForm({
  clientSecret,
  amount,
  onSuccess,
  onCancel,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (loading) return;

      setError(null);
      setLoading(true);

      // Handle mock mode
      if (clientSecret.startsWith('pi_mock_')) {
        setTimeout(() => {
          setLoading(false);
          onSuccess(clientSecret);
        }, 1500);
        return;
      }

      if (!stripe || !elements) {
        setError('Stripe has not loaded yet. Please try again.');
        setLoading(false);
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError('Payment input not found.');
        setLoading(false);
        return;
      }

      try {
        const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: 'Test Rider',
            },
          },
        });

        if (stripeError) {
          setError(stripeError.message || 'Payment confirmation failed.');
        } else if (paymentIntent && (paymentIntent.status === 'requires_capture' || paymentIntent.status === 'succeeded')) {
          onSuccess(paymentIntent.id);
        } else {
          setError('Unexpected payment status: ' + (paymentIntent?.status || 'unknown'));
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred during payment.');
      } finally {
        setLoading(false);
      }
    },
    [stripe, elements, clientSecret, onSuccess, loading]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Beautiful Gradient Header */}
        <div className="bg-gradient-to-r from-gray-900 to-black px-6 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-2xl" />
          
          <h3 className="text-xl font-bold tracking-tight">Confirm Authorization</h3>
          <p className="text-sm text-gray-400 mt-1">Pre-authorize your ride fare to request a driver</p>
          
          <div className="mt-6 flex items-baseline justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estimated Fare</span>
            <span className="text-3xl font-extrabold tracking-tight">${(amount / 100).toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Card Mockup (Wow Aesthetic) */}
          <div className="w-full h-44 rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white p-5 shadow-lg relative flex flex-col justify-between mb-6 overflow-hidden">
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-white/5 opacity-50 backdrop-blur-[1px]" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />
            
            <div className="flex justify-between items-start z-10">
              <div className="h-9 w-12 bg-yellow-500/80 rounded-md border border-yellow-300 flex items-center justify-center relative shadow-inner">
                {/* Chip line details */}
                <div className="absolute inset-x-2 top-2 bottom-2 border border-black/20 rounded" />
              </div>
              <span className="text-lg font-bold tracking-widest italic opacity-90">RouteWise</span>
            </div>

            <div className="z-10">
              <p className="text-lg font-mono tracking-widest opacity-80 mb-2">•••• •••• •••• 4242</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Card Holder</p>
                  <p className="text-xs tracking-wide font-medium font-mono">Test Rider</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Expires</p>
                  <p className="text-xs font-mono font-medium">12/29</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actual Card Input Field */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Card Details
              </label>
              <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 focus-within:border-black focus-within:bg-white focus-within:ring-1 focus-within:ring-black transition-all">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 items-start text-red-700 text-sm animate-shake">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <p className="text-[11px] text-gray-400 leading-normal text-center">
              Your card will be authorized for the fare amount. Funds are captured only after trip completion. Cancellations will automatically release the hold.
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-700 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="py-3 px-4 rounded-xl bg-black hover:bg-gray-800 active:bg-gray-900 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <span>Authorize Fare</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
