import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { dashboardService } from '../services/dashboardService';
import { reviewService } from '../services/reviewService';
import { formatPrice, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import AnimatedCounter from '../components/AnimatedCounter';
import { useToast } from '../context/ToastContext';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ExternalLink,
  ShieldCheck,
  PackageCheck,
  IndianRupee,
  XCircle,
  Package,
  Star,
  Loader2,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function OrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [buyerMetrics, setBuyerMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Handover Confirmation Modal State
  const [handoverModalOrder, setHandoverModalOrder] = useState(null);
  const [confirmingHandover, setConfirmingHandover] = useState(false);

  // Review Modal State
  const [reviewModalOrder, setReviewModalOrder] = useState(null);
  const [modalRating, setModalRating] = useState(5);
  const [modalComment, setModalComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [modalReviewError, setModalReviewError] = useState(null);

  const fetchOrdersAndMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderList, metrics] = await Promise.all([
        orderService.getMyOrders(),
        dashboardService.getBuyerDashboard().catch(() => null),
      ]);
      setOrders(orderList || []);
      setBuyerMetrics(metrics);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Unable to load your orders. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndMetrics();
  }, []);

  const handleOpenHandoverModal = (order) => {
    setHandoverModalOrder(order);
  };

  const handleExecuteHandover = async () => {
    if (!handoverModalOrder) return;
    const orderId = handoverModalOrder.id;

    setConfirmingHandover(true);
    try {
      await orderService.completeOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'COMPLETED' } : o))
      );
      toast.success('Handover confirmed! Escrow funds have been released to the seller.');
      setHandoverModalOrder(null);
    } catch (err) {
      console.error('Failed to complete order:', err);
      toast.error(err.response?.data?.message || 'Failed to complete order handover.');
    } finally {
      setConfirmingHandover(false);
    }
  };

  const handleReconcileOrder = async (orderId) => {
    setActionLoadingId(orderId);
    try {
      const updated = await orderService.reconcilePayment(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updated : o))
      );
      if (updated.status === 'PAID') {
        toast.success('Payment verified! The order is now confirmed and in Escrow.');
      } else {
        toast.info(`Order status is: ${updated.status}. If your payment was deducted, Razorpay may take a moment to sync.`);
      }
    } catch (err) {
      console.error('Failed to reconcile order:', err);
      toast.error(err.response?.data?.message || 'Reconciliation check failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenReviewModal = (order) => {
    setReviewModalOrder(order);
    setModalRating(5);
    setModalComment('');
    setModalReviewError(null);
  };

  const handleSubmitOrderReview = async (e) => {
    e.preventDefault();
    if (!reviewModalOrder) return;
    if (!modalComment.trim()) {
      setModalReviewError('Please enter a review description.');
      return;
    }

    setSubmittingReview(true);
    setModalReviewError(null);
    try {
      await reviewService.createReview({
        orderId: reviewModalOrder.id,
        listingId: reviewModalOrder.listingId,
        rating: modalRating,
        comment: modalComment.trim(),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === reviewModalOrder.id ? { ...o, alreadyReviewed: true } : o))
      );
      setReviewModalOrder(null);
      toast.success('Thank you! Your verified student review has been published.');
    } catch (err) {
      console.error('Failed to submit review:', err);
      setModalReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return {
          bg: 'var(--sage-light)',
          color: 'var(--charcoal)',
          border: 'var(--border-subtle)',
          label: 'PAID (ESCROW SECURE)',
          desc: 'Ready for campus handover',
        };
      case 'COMPLETED':
        return {
          bg: '#ffffff',
          color: 'var(--text-muted)',
          border: 'var(--border-subtle)',
          label: 'COMPLETED',
          desc: 'Handover finalized',
        };
      case 'CANCELLED':
        return {
          bg: 'rgba(239, 68, 68, 0.08)',
          color: '#991b1b',
          border: 'rgba(239, 68, 68, 0.2)',
          label: 'CANCELLED',
          desc: 'Order cancelled',
        };
      default:
        return {
          bg: 'rgba(229, 161, 91, 0.1)',
          color: 'var(--charcoal)',
          border: 'rgba(229, 161, 91, 0.3)',
          label: status || 'PENDING PAYMENT',
          desc: 'Awaiting payment confirmation',
        };
    }
  };

  // Derive overview metrics directly from orders if backend metrics are unavailable
  const totalOrdersCount = buyerMetrics?.totalOrders ?? orders.length;
  const confirmedCount = buyerMetrics?.confirmedOrders ?? orders.filter(o => o.status === 'PAID' || o.status === 'COMPLETED').length;
  const pendingCount = buyerMetrics?.pendingOrders ?? orders.filter(o => o.status === 'PENDING_PAYMENT').length;
  const cancelledCount = buyerMetrics?.cancelledOrders ?? orders.filter(o => o.status === 'CANCELLED').length;
  const totalSpent = buyerMetrics?.totalSpent ?? orders
    .filter(o => o.status === 'PAID' || o.status === 'COMPLETED')
    .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  return (
    <div className="page-enter" style={{ padding: '3.5rem 0 5rem 0', minHeight: '85vh', backgroundColor: 'var(--warm-white)' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'var(--sage-light)', color: 'var(--charcoal)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
            <ShoppingBag size={14} color="var(--muted-green)" /> Campus Escrow Orders
          </div>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', letterSpacing: '-0.03em', fontWeight: 800, color: 'var(--charcoal)', lineHeight: 1.15 }}>
            Buyer Dashboard &amp; Orders
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: 0, lineHeight: 1.5 }}>
            Track campus escrow purchases, meetups at landmarks, and confirm physical item handovers.
          </p>
        </div>

        {/* Buyer Overview Analytics Cards */}
        {orders.length > 0 && (
          <div
            className="stagger-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2.5rem',
            }}
          >
            {/* Total Spent */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                padding: '1.4rem',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Spent</span>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--sage-light)', color: 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IndianRupee size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>
                <AnimatedCounter value={totalSpent} prefix="₹" />
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--muted-green)', fontWeight: 700, marginTop: '2px' }}>
                Verified Purchases
              </div>
            </div>

            {/* Total Orders */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                padding: '1.4rem',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Orders</span>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--sage-light)', color: 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                <AnimatedCounter value={totalOrdersCount} />
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                All Time Placed
              </div>
            </div>

            {/* Confirmed / In Escrow */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                padding: '1.4rem',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Paid / In Escrow</span>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--sage-light)', color: 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                <AnimatedCounter value={confirmedCount} />
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--muted-green)', fontWeight: 700, marginTop: '2px' }}>
                Ready for Handover
              </div>
            </div>

            {/* Pending Checkout */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                padding: '1.4rem',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pending Checkout</span>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(229, 161, 91, 0.1)', color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                <AnimatedCounter value={pendingCount} />
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--accent-orange)', fontWeight: 700, marginTop: '2px' }}>
                {cancelledCount > 0 ? `${cancelledCount} Cancelled` : 'Awaiting Payment'}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Loading your order history &amp; purchases..." />
        ) : error ? (
          <EmptyState
            title="Connection Error"
            message={error}
            actionText="Try Again"
            onAction={fetchOrdersAndMetrics}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            message="You haven't purchased or reserved any student marketplace items yet."
            actionText="Browse Marketplace"
            actionLink="/browse"
          />
        ) : (
          <div className="stagger-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
            {orders.map((order) => {
              const badge = getStatusBadge(order.status);
              const paymentStatusText = order.paymentStatus ||
                (order.status === 'PAID' || order.status === 'COMPLETED' ? 'SUCCESS' : order.status === 'CANCELLED' ? 'FAILED' : 'PENDING');

              return (
                <div
                  key={order.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-xs)',
                    transition: 'all 0.22s ease',
                  }}
                  className="order-card-item"
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '0.85rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid var(--sage-light)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--charcoal)' }}>
                          Order #{order.id}
                        </span>
                        <span
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            fontWeight: 700,
                            fontSize: '0.725rem',
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-pill)',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        Placed on {formatDate(order.createdAt)} • Seller: <strong style={{ color: 'var(--charcoal)' }}>{order.sellerName || 'Student Seller'}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                        {formatPrice(order.amount)}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                        Payment: <strong style={{ color: paymentStatusText === 'SUCCESS' ? 'var(--muted-green)' : undefined }}>{paymentStatusText}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Order Body with Product Image and Landmark */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1.25rem',
                      paddingTop: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {order.listingImageUrl ? (
                        <img
                          src={order.listingImageUrl}
                          alt={order.listingTitle}
                          style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--warm-white)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <Package size={22} />
                        </div>
                      )}

                      <div>
                        <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
                          <Link to={`/listings/${order.listingId}`} style={{ color: 'var(--charcoal)', textDecoration: 'none' }} className="order-title-link">
                            {order.listingTitle || `Item #${order.listingId}`}
                          </Link>
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <MapPin size={15} color="var(--muted-green)" />
                          <span>Pickup Spot: <strong style={{ color: 'var(--charcoal)' }}>{order.pickupLocation || order.pickupNotes || 'Campus Meeting Landmark'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <Link
                        to={`/listings/${order.listingId}`}
                        className="btn btn-sm btn-outline btn-pill"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <ExternalLink size={13} />
                        <span>View Listing</span>
                      </Link>

                      {order.status === 'PENDING_PAYMENT' && (
                        <button
                          type="button"
                          onClick={() => handleReconcileOrder(order.id)}
                          disabled={actionLoadingId === order.id}
                          className="btn btn-sm btn-outline btn-pill"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontWeight: 600,
                          }}
                        >
                          <RefreshCw size={13} />
                          <span>{actionLoadingId === order.id ? 'Checking...' : 'Recheck Status'}</span>
                        </button>
                      )}

                      {order.status === 'PAID' && (
                        <button
                          type="button"
                          onClick={() => handleOpenHandoverModal(order)}
                          disabled={actionLoadingId === order.id}
                          className="btn btn-sm btn-primary btn-pill"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontWeight: 700,
                          }}
                        >
                          <PackageCheck size={15} />
                          <span>Confirm Received (Handover)</span>
                        </button>
                      )}

                      {/* Review Action for Paid/Completed Orders */}
                      {(order.status === 'PAID' || order.status === 'COMPLETED' || order.eligibleForReview) && (
                        order.alreadyReviewed ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              color: 'var(--charcoal)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              padding: '0.4rem 0.85rem',
                              background: 'var(--sage-light)',
                              borderRadius: 'var(--radius-pill)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            <CheckCircle2 size={14} color="var(--muted-green)" /> Reviewed
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(order)}
                            className="btn btn-sm btn-pill"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              fontWeight: 700,
                              borderColor: 'rgba(229, 161, 91, 0.4)',
                              color: 'var(--charcoal)',
                              backgroundColor: 'rgba(229, 161, 91, 0.1)',
                              border: '1px solid rgba(229, 161, 91, 0.4)',
                            }}
                          >
                            <Star size={14} fill="var(--accent-orange)" color="var(--accent-orange)" />
                            <span>Leave Review</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modern Handover Confirmation Modal */}
        {handoverModalOrder && (
          <div className="modal-overlay" onClick={() => !confirmingHandover && setHandoverModalOrder(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <div className="modal-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                    Confirm Physical Handover
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Order #{handoverModalOrder.id} • Campus Escrow Release
                  </div>
                </div>
              </div>

              <div className="modal-body">
                {/* Product Preview Card */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    backgroundColor: 'var(--warm-white)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '1.25rem',
                  }}
                >
                  {handoverModalOrder.listingImageUrl ? (
                    <img
                      src={handoverModalOrder.listingImageUrl}
                      alt={handoverModalOrder.listingTitle}
                      style={{
                        width: '54px',
                        height: '54px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--sage-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--charcoal)',
                      }}
                    >
                      <Package size={24} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: 'var(--charcoal)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {handoverModalOrder.listingTitle || `Item #${handoverModalOrder.listingId}`}
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Amount in Escrow: <strong style={{ color: 'var(--charcoal)' }}>{formatPrice(handoverModalOrder.amount)}</strong>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.9rem 1.1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--sage-light)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.875rem',
                    color: 'var(--charcoal)',
                    lineHeight: 1.55,
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                  }}
                >
                  <ShieldCheck size={20} color="var(--muted-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    Please confirm that you have met seller <strong style={{ color: 'var(--charcoal)' }}>{handoverModalOrder.sellerName || 'the student seller'}</strong> in person on campus and inspected this item. Confirming handover will complete the transaction and release payment to the seller.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setHandoverModalOrder(null)}
                    disabled={confirmingHandover}
                    className="btn btn-outline btn-pill"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteHandover}
                    disabled={confirmingHandover}
                    className="btn btn-primary btn-pill"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontWeight: 700,
                    }}
                  >
                    {confirmingHandover ? <Loader2 size={16} className="spin" /> : <PackageCheck size={16} />}
                    <span>{confirmingHandover ? 'Releasing Escrow...' : 'Yes, Confirm Handover'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modern Review Modal */}
        {reviewModalOrder && (
          <div className="modal-overlay" onClick={() => setReviewModalOrder(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                    Review Your Purchase
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Rate your campus exchange for <strong>{reviewModalOrder.listingTitle || `Item #${reviewModalOrder.listingId}`}</strong>
                  </div>
                </div>
              </div>

              <div className="modal-body">
                {modalReviewError && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#b91c1c',
                      fontSize: '0.85rem',
                      marginBottom: '1.25rem',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                    }}
                  >
                    {modalReviewError}
                  </div>
                )}

                <form onSubmit={handleSubmitOrderReview}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.65rem' }}>
                      Overall Experience Rating:
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setModalRating(s)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', transition: 'transform 0.15s ease' }}
                        >
                          <Star
                            size={30}
                            fill={modalRating >= s ? 'var(--accent-orange)' : 'none'}
                            color={modalRating >= s ? 'var(--accent-orange)' : 'var(--border-subtle)'}
                          />
                        </button>
                      ))}
                      <span style={{ fontSize: '0.95rem', color: 'var(--charcoal)', marginLeft: '0.5rem', fontWeight: 700 }}>
                        {modalRating === 5 ? '5 ★ - Excellent' : modalRating === 4 ? '4 ★ - Good' : modalRating === 3 ? '3 ★ - Average' : modalRating === 2 ? '2 ★ - Fair' : '1 ★ - Poor'}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.5rem' }}>
                      Your Review &amp; Comments:
                    </label>
                    <textarea
                      className="form-textarea"
                      rows={4}
                      required
                      placeholder="Share details about item condition, accuracy of description, and how the campus meetup went..."
                      value={modalComment}
                      onChange={(e) => setModalComment(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setReviewModalOrder(null)}
                      disabled={submittingReview}
                      className="btn btn-outline btn-pill"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview || !modalComment.trim()}
                      className="btn btn-primary btn-pill"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}
                    >
                      {submittingReview ? <Loader2 size={16} className="spin" /> : <Star size={16} />}
                      <span>Submit Verified Review</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .order-card-item:hover {
          border-color: var(--charcoal) !important;
          box-shadow: var(--shadow-sm) !important;
        }
        .order-title-link:hover {
          color: var(--muted-green) !important;
        }
      `}</style>
    </div>
  );
}
