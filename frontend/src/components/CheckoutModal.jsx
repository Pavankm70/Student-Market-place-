import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { formatPrice } from '../utils/formatters';
import {
  CreditCard,
  ShieldCheck,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Lock,
  Loader2,
  X,
  Info,
} from 'lucide-react';

export default function CheckoutModal({
  isOpen,
  onClose,
  listing,
  onOrderSuccess,
}) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [orderCreated, setOrderCreated] = useState(null);
  const [paymentStep, setPaymentStep] = useState('review'); // 'review' | 'paying' | 'success'
  const [paymentAttempted, setPaymentAttempted] = useState(false);

  if (!isOpen || !listing) return null;

  const handleClose = async () => {
    if (orderCreated?.id && paymentStep !== 'success' && !paymentAttempted) {
      try {
        await orderService.cancelOrder(orderCreated.id);
      } catch (cancelErr) {
        console.warn('Auto-release on modal close:', cancelErr);
      }
    }
    onClose();
  };

  const handleReconcile = async () => {
    if (!orderCreated?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      const reconciled = await orderService.reconcilePayment(orderCreated.id);
      if (reconciled.status === 'PAID' || reconciled.status === 'COMPLETED') {
        setPaymentStep('success');
        if (onOrderSuccess) onOrderSuccess(reconciled);
      } else {
        setError(
          `Order payment status is currently: ${reconciled.status}. If your payment was deducted, Razorpay may take a moment to confirm.`
        );
      }
    } catch (rErr) {
      setError(
        rErr.response?.data?.message || 'Reconciliation check failed. Please check My Orders or contact support.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitiatePayment = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Step 1: Create Order in database
      const order = await orderService.createOrder(listing.id);
      setOrderCreated(order);

      if (order.status === 'PAID' || order.status === 'COMPLETED') {
        setPaymentStep('success');
        if (onOrderSuccess) onOrderSuccess(order);
        return;
      }

      // Step 2: Initialize Payment (Razorpay)
      const paymentInit = await orderService.initiatePayment(order.id);
      const razorpayKey =
        paymentInit.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Tr0vZ94TcR5yD8';
      const rzpOrderId = paymentInit.razorpayOrderId;

      if (window.Razorpay && rzpOrderId && !rzpOrderId.startsWith('order_test_')) {
        const options = {
          key: razorpayKey,
          amount: paymentInit.amountInPaise || Math.round(listing.price * 100),
          currency: paymentInit.currency || 'INR',
          name: 'CampusLoop Marketplace',
          description: `Order #${order.id}: ${listing.title}`,
          order_id: rzpOrderId,
          handler: async function (response) {
            setPaymentAttempted(true);
            try {
              setSubmitting(true);
              const verifyRes = await orderService.verifyPayment({
                orderId: order.id,
                razorpayOrderId: response.razorpay_order_id || rzpOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              setPaymentStep('success');
              if (onOrderSuccess) onOrderSuccess(verifyRes);
            } catch (vErr) {
              const errMsg = vErr.response?.data?.message || 'Payment signature verification failed.';
              setError(
                `${errMsg} If your payment was deducted, please click 'Recheck Payment Status with Razorpay'.`
              );
            } finally {
              setSubmitting(false);
            }
          },
          prefill: {
            name: paymentInit.buyerName || order.buyerName || 'Campus Student',
            email: paymentInit.buyerEmail || order.buyerEmail || '',
          },
          theme: {
            color: '#20231F',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setPaymentAttempted(true);
          setError(
            `Payment Failed: ${resp.error?.description || 'Transaction cancelled'}. You can retry or cancel this order.`
          );
          setSubmitting(false);
        });
        rzp.open();
        setSubmitting(false);
      } else {
        // Test Simulation Mode
        const mockPaymentId = `pay_test_${Date.now()}`;
        const mockSignature = `test_signature_valid`;

        const verifiedOrder = await orderService.verifyPayment({
          orderId: order.id,
          razorpayOrderId: rzpOrderId || `order_test_${order.id}`,
          razorpayPaymentId: mockPaymentId,
          razorpaySignature: mockSignature,
        });

        setPaymentStep('success');
        if (onOrderSuccess) onOrderSuccess(verifiedOrder);
      }
    } catch (err) {
      console.error('Order creation/payment failed:', err);
      const serverMsg = err.response?.data?.message;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request timed out. Please check your network connection and try again.');
      } else if (err.response?.status === 404) {
        setError('This listing could not be found.');
      } else if (err.response?.status === 403) {
        setError('You are not authorized to purchase this listing.');
      } else if (err.response?.status === 400) {
        setError(serverMsg || 'Unable to process order with the provided information.');
      } else {
        setError('Unable to initiate checkout. Please try again shortly.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      style={{
        zIndex: 1050,
        backgroundColor: 'rgba(32, 35, 31, 0.45)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          width: '92%',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: '#FFFFFF',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-subtle)',
          padding: '2rem',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--charcoal)',
                color: 'var(--warm-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CreditCard size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>
                {paymentStep === 'success' ? 'Order Confirmed!' : 'Campus Escrow Checkout'}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Razorpay Test Mode • Verified Escrow Protection
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem 0 0 0' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                background: '#FEF2F2',
                color: '#991B1B',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
                border: '1px solid #FECACA',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
              {orderCreated && (
                <button
                  type="button"
                  onClick={handleReconcile}
                  disabled={submitting}
                  className="btn btn-sm btn-pill"
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: '0.25rem',
                    backgroundColor: 'var(--charcoal)',
                    color: '#ffffff',
                    fontWeight: 600,
                  }}
                >
                  {submitting ? 'Checking Status...' : 'Recheck Payment Status with Razorpay'}
                </button>
              )}
            </div>
          )}

          {paymentStep === 'success' ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--sage-light)',
                  color: 'var(--muted-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem auto',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h4 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>
                Payment Successfully Verified!
              </h4>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', margin: '0 0 1.5rem 0', lineHeight: 1.6 }}>
                Order #{orderCreated?.orderNumber || 'CONFIRMED'} has been created. The item is now locked and reserved exclusively for you.
              </p>
              <div
                style={{
                  background: 'var(--warm-white)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.15rem 1.25rem',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--charcoal)' }}>Campus Meeting Spot:</strong>{' '}
                  <span style={{ color: 'var(--charcoal)', fontWeight: 600 }}>{listing.pickupLocation || 'Campus Meeting Area'}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--charcoal)' }}>Seller Contact:</strong>{' '}
                  <span style={{ color: 'var(--text-muted)' }}>{listing.sellerEmail}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/orders');
                  }}
                  className="btn btn-primary btn-pill"
                >
                  View My Orders
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-outline btn-pill"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Item Card in Modal */}
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--warm-white)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1.25rem',
                  alignItems: 'center',
                }}
              >
                {listing.imageUrl ? (
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    style={{ width: '68px', height: '68px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--sage-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--charcoal)',
                    }}
                  >
                    Campus Item
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4
                    style={{
                      margin: '0 0 0.25rem 0',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--charcoal)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {listing.title}
                  </h4>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={13} color="var(--muted-green)" /> {listing.pickupLocation || 'Campus Meeting Area'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--charcoal)', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
                    {formatPrice(listing.price)}
                  </div>
                </div>
              </div>

              {/* Safety & Payout Disclaimers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--sage-light)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.825rem',
                    color: 'var(--charcoal)',
                  }}
                >
                  <ShieldCheck size={18} color="var(--muted-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    <strong>Escrow Protected:</strong> Funds remain securely locked in Campus Escrow until you inspect the item and confirm handover.
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--warm-white)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.825rem',
                    color: 'var(--charcoal)',
                  }}
                >
                  <Info size={18} color="var(--accent-orange)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    <strong>Razorpay Test Mode:</strong> Safe student testing environment with simulated card/UPI flows.
                  </span>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '1rem',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Item Price</span>
                  <span style={{ fontWeight: 600, color: 'var(--charcoal)' }}>{formatPrice(listing.price)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Campus Handover Delivery</span>
                  <span style={{ color: 'var(--muted-green)', fontWeight: 700 }}>FREE (In-Person)</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '0.75rem',
                    marginTop: '0.5rem',
                    color: 'var(--charcoal)',
                  }}
                >
                  <span>Total Escrow Amount</span>
                  <span style={{ color: 'var(--charcoal)' }}>{formatPrice(listing.price)}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-outline btn-pill"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={submitting}
                  className="btn btn-primary btn-pill"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="spin" /> Locking Escrow...
                    </>
                  ) : (
                    <>
                      <Lock size={15} /> Confirm &amp; Pay via Escrow
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
