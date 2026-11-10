import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { orderService } from '../services/orderService';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import AnimatedCounter from '../components/AnimatedCounter';
import OrderDistributionPieChart from '../components/charts/OrderDistributionPieChart';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import {
  TrendingUp,
  Package,
  CheckCircle2,
  Clock,
  Star,
  IndianRupee,
  ShoppingBag,
  Info,
  ExternalLink,
  PlusCircle,
  AlertCircle,
  MapPin,
  ShieldCheck,
  Award,
  BarChart2,
  PieChart,
  Mail,
  Send,
  Loader2,
  RefreshCw,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [sales, setSales] = useState([]);
  const [sellerReviews, setSellerReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // SMTP Diagnostic State
  const [emailDiag, setEmailDiag] = useState(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, s, diag, r] = await Promise.all([
        dashboardService.getSellerDashboard(),
        orderService.getMySellerSales().catch(() => []),
        dashboardService.getEmailDiagnostics().catch(() => null),
        user?.id ? reviewService.getReviewsForSeller(user.id).catch(() => []) : Promise.resolve([]),
      ]);
      setMetrics(m);
      setSales(s || []);
      setEmailDiag(diag);
      const combinedReviews = (m?.recentReviews && m.recentReviews.length > 0) ? m.recentReviews : (r || []);
      setSellerReviews(combinedReviews);
    } catch (err) {
      console.error('Failed to load seller dashboard:', err);
      setError('Unable to load seller dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await dashboardService.sendTestEmail();
      setEmailTestResult(res);
      setEmailDiag(res);
    } catch (err) {
      setEmailTestResult({
        success: false,
        status: 'ERROR',
        message: err.response?.data?.message || err.message || 'Failed to submit test email.',
      });
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Calculating seller performance analytics..." />;
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '4rem 1rem' }}>
        <EmptyState
          title="Dashboard Error"
          message={error}
          actionText="Try Again"
          onAction={() => fetchDashboard()}
        />
      </div>
    );
  }

  // Combine sales records from orders API and recent orders from metrics
  const displaySales = (sales && sales.length > 0) ? sales : (metrics?.recentOrders || []);

  const verifiedRevenue = metrics?.verifiedRevenue ?? metrics?.totalRevenue ?? 0;
  const completedCount = metrics?.completedHandovers ?? metrics?.completedSalesCount ?? metrics?.completedSales ?? 0;
  const confirmedCount = metrics?.confirmedOrders ?? displaySales.filter(s => s.status === 'PAID').length;
  const pendingCount = metrics?.pendingOrders ?? displaySales.filter(s => s.status === 'PENDING_PAYMENT').length;
  const cancelledCount = metrics?.cancelledOrders ?? displaySales.filter(s => s.status === 'CANCELLED').length;
  const totalListings = metrics?.totalListings ?? 0;
  const availableCount = metrics?.availableListings ?? metrics?.availableCount ?? 0;
  const reservedCount = metrics?.reservedListings ?? metrics?.reservedCount ?? 0;
  const soldCount = metrics?.soldListings ?? metrics?.soldCount ?? 0;

  return (
    <div className="page-enter" style={{ padding: '3.5rem 0 5rem 0', minHeight: '85vh', backgroundColor: 'var(--warm-white)' }}>
      <div className="container" style={{ maxWidth: '1180px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            marginBottom: '2.5rem',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'var(--sage-light)', color: 'var(--charcoal)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
              <TrendingUp size={14} color="var(--muted-green)" /> Seller Analytics
            </div>
            <h1 style={{ fontSize: '2.5rem', margin: 0, letterSpacing: '-0.03em', fontWeight: 800, color: 'var(--charcoal)', lineHeight: 1.15 }}>
              Seller Performance Dashboard
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: '0.45rem 0 0 0', lineHeight: 1.5 }}>
              Real-time university sales volume, order fulfillment, and student buyer reviews.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={fetchDashboard}
              className="btn btn-outline btn-pill"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              title="Refresh Dashboard"
            >
              <RefreshCw size={15} />
              <span>Refresh Data</span>
            </button>
            <Link
              to="/create"
              className="btn btn-primary btn-pill"
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}
            >
              <PlusCircle size={17} />
              <span>Post New Listing</span>
            </Link>
          </div>
        </div>

        {/* Metric Summary Cards Grid */}
        <div
          className="stagger-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem',
          }}
        >
          {/* Revenue */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed Revenue</span>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--sage-light)', color: 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IndianRupee size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>
              <AnimatedCounter value={verifiedRevenue} isCurrency={true} formatter={formatPrice} />
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--muted-green)', fontWeight: 700, marginTop: '4px' }}>
              ✓ Verified Paid &amp; Completed
            </div>
          </div>

          {/* Completed Sales */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed Handovers</span>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--sage-light)', color: 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--charcoal)' }}>
              <AnimatedCounter value={completedCount} />
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {confirmedCount} Paid Escrows Awaiting Pickup
            </div>
          </div>

          {/* Orders Received */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Orders Received</span>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(229, 161, 91, 0.1)', color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--charcoal)' }}>
              <AnimatedCounter value={metrics?.ordersReceived ?? displaySales.length} />
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {pendingCount} Pending • {cancelledCount} Cancelled
            </div>
          </div>

          {/* Listings Breakdown */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>My Listings</span>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--sage-light)', color: 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--charcoal)' }}>
              <AnimatedCounter value={totalListings} />
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {availableCount} Active • {reservedCount} Hold • {soldCount} Sold
            </div>
          </div>

          {/* Seller Rating */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Seller Trust Rating</span>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(229, 161, 91, 0.1)', color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star size={18} fill="var(--accent-orange)" />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--charcoal)' }}>
              {metrics?.averageRating ? <><AnimatedCounter value={metrics.averageRating} /> ★</> : 'No reviews'}
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {metrics?.totalReviews || 0} Verified Student Review{metrics?.totalReviews === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        {/* Visual Analytics Grid: Bar/Trend Chart + Donut Distribution Chart */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '1.75rem',
            marginBottom: '2.5rem',
          }}
        >
          {/* Sales Trends Chart */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <BarChart2 size={20} color="var(--charcoal)" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                Sales Performance Trends
              </h3>
            </div>
            <SalesTrendChart trends={metrics?.salesOverTime || []} sales={displaySales} />
          </div>

          {/* Order Distribution Pie Chart */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <PieChart size={20} color="var(--charcoal)" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                Fulfillment Distribution
              </h3>
            </div>
            <OrderDistributionPieChart
              pending={pendingCount}
              confirmed={confirmedCount}
              completed={completedCount}
              cancelled={cancelledCount}
            />
          </div>
        </div>

        {/* Listing Performance Breakdown */}
        {metrics?.topListings && metrics.topListings.length > 0 && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '1.75rem',
              marginBottom: '2.5rem',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Award size={20} color="var(--charcoal)" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                Listing Performance Ledger
              </h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Listing Item</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Price</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Listing Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Total Orders</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Completed Sales</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Revenue Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topListings.map(item => (
                    <tr key={item.listingId} style={{ borderBottom: '1px solid var(--sage-light)' }}>
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--warm-white)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)'
                            }}>
                              Item
                            </div>
                          )}
                          <Link to={`/listings/${item.listingId}`} style={{ color: 'var(--charcoal)', textDecoration: 'none', fontWeight: 700 }} className="order-title-link">
                            {item.title}
                          </Link>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: 'var(--charcoal)' }}>
                        {formatPrice(item.price)}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: 'var(--radius-pill)',
                          backgroundColor: item.status === 'SOLD' ? 'var(--sage-light)' : item.status === 'RESERVED' ? 'rgba(229, 161, 91, 0.1)' : 'var(--sage-light)',
                          color: item.status === 'SOLD' ? 'var(--text-muted)' : item.status === 'RESERVED' ? 'var(--accent-orange)' : 'var(--charcoal)',
                          border: `1px solid ${item.status === 'SOLD' ? 'var(--border-subtle)' : item.status === 'RESERVED' ? 'rgba(229, 161, 91, 0.4)' : 'var(--border-subtle)'}`
                        }}>
                          {item.status || 'AVAILABLE'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600 }}>
                        {item.ordersCount ?? item.salesCount}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: 'var(--muted-green)' }}>
                        {item.salesCount}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                        {formatPrice(item.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Gmail SMTP Diagnostic & Connectivity Panel */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '1.5rem',
            marginBottom: '2.5rem',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  background: emailDiag?.status === 'SUCCESS' || emailDiag?.status === 'CONFIGURED' ? 'var(--sage-light)' : 'rgba(239, 68, 68, 0.08)',
                  color: emailDiag?.status === 'SUCCESS' || emailDiag?.status === 'CONFIGURED' ? 'var(--charcoal)' : '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mail size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                  Gmail SMTP Notification Service
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Host: {emailDiag?.host || 'smtp.gmail.com'}:{emailDiag?.port || 465} • Account: {emailDiag?.maskedUsername || 'Not Configured'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: emailDiag?.status === 'SUCCESS' || emailDiag?.status === 'CONFIGURED' ? 'var(--sage-light)' : 'rgba(239, 68, 68, 0.08)',
                  color: emailDiag?.status === 'SUCCESS' || emailDiag?.status === 'CONFIGURED' ? 'var(--charcoal)' : '#991b1b',
                  border: `1px solid ${emailDiag?.status === 'SUCCESS' || emailDiag?.status === 'CONFIGURED' ? 'var(--border-subtle)' : 'rgba(239, 68, 68, 0.25)'}`
                }}
              >
                {emailDiag?.status || 'UNVERIFIED'}
              </span>

              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="btn btn-outline btn-pill"
                style={{ fontSize: '0.825rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {testingEmail ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                <span>{testingEmail ? 'Testing SMTP...' : 'Send Test Email'}</span>
              </button>
            </div>
          </div>

          {emailTestResult && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                background: emailTestResult.success ? 'var(--sage-light)' : 'rgba(239, 68, 68, 0.08)',
                color: emailTestResult.success ? 'var(--charcoal)' : '#991b1b',
                border: `1px solid ${emailTestResult.success ? 'var(--border-subtle)' : 'rgba(239, 68, 68, 0.25)'}`,
              }}
            >
              <strong>{emailTestResult.status}:</strong> {emailTestResult.message}
            </div>
          )}
        </div>

        {/* Payout Escrow Notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--sage-light)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--charcoal)',
            marginBottom: '2.5rem',
            fontSize: '0.885rem',
            lineHeight: 1.55,
          }}
        >
          <Info size={22} color="var(--muted-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Marketplace Escrow Payout Policy:</strong> CampusLoop operates with Razorpay test escrow security. Coordinate in-person campus handovers with buyers, inspect items together at designated landmarks, and have the student buyer confirm delivery in their orders page to conclude the transaction.
          </div>
        </div>

        {/* Buyer Reviews & Ratings Received */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '1.75rem',
            marginBottom: '2.5rem',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Star size={22} fill="var(--accent-orange)" color="var(--accent-orange)" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                  Buyer Reviews &amp; Seller Reputation
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Verified reviews and ratings submitted by student buyers upon handover.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                {metrics?.averageRating ? `${metrics.averageRating.toFixed(1)} ★` : 'No ratings yet'}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                ({sellerReviews.length} {sellerReviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>

          {sellerReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <MessageSquare size={38} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
              <h4 style={{ margin: '0 0 0.35rem 0', fontWeight: 700, color: 'var(--charcoal)' }}>No buyer reviews received yet</h4>
              <p style={{ fontSize: '0.875rem', margin: 0, maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
                When buyers purchase your items and complete campus handover, their feedback and ratings will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {sellerReviews.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--warm-white)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--charcoal)' }}>
                          {r.reviewerName || 'Student Buyer'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatDate(r.createdAt)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={15}
                            fill={s <= r.rating ? 'var(--accent-orange)' : 'none'}
                            color={s <= r.rating ? 'var(--accent-orange)' : 'var(--border-subtle)'}
                          />
                        ))}
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      "{r.comment}"
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '0.65rem',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <Link
                      to={`/listings/${r.listingId}`}
                      style={{ color: 'var(--charcoal)', textDecoration: 'none', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}
                    >
                      {r.listingTitle || `Item #${r.listingId}`}
                    </Link>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--muted-green)', fontWeight: 700, fontSize: '0.75rem' }}>
                      <ShieldCheck size={14} /> Verified Buyer
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seller Order Management Table */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                Orders Received &amp; Sales Ledger
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Track student buyers, escrow payments, and arrange handoffs at campus meeting spots.
              </p>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--charcoal)', fontWeight: 700, backgroundColor: 'var(--sage-light)', padding: '4px 12px', borderRadius: 'var(--radius-pill)' }}>
              {displaySales.length} order{displaySales.length === 1 ? '' : 's'} total
            </span>
          </div>

          {displaySales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              <Package size={44} style={{ margin: '0 auto 0.85rem auto', opacity: 0.4 }} />
              <h4 style={{ margin: '0 0 0.35rem 0', fontWeight: 700, color: 'var(--charcoal)' }}>No orders received yet</h4>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>
                Ensure your listings are published with accurate pricing and campus landmark pickup locations.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Order #</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Listing Item</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Buyer</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Amount</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Payment Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Order Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Pickup Landmark</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {displaySales.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--sage-light)' }}>
                      <td style={{ padding: '0.95rem 0.5rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                        #{s.id}
                      </td>
                      <td style={{ padding: '0.95rem 0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {s.listingImageUrl && (
                            <img
                              src={s.listingImageUrl}
                              alt={s.listingTitle}
                              style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                            />
                          )}
                          <Link to={`/listings/${s.listingId}`} style={{ color: 'var(--charcoal)', textDecoration: 'none', fontWeight: 700 }}>
                            {s.listingTitle || `Item #${s.listingId}`}
                          </Link>
                        </div>
                      </td>
                      <td style={{ padding: '0.95rem 0.5rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--charcoal)' }}>{s.buyerName || 'Student Buyer'}</div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{s.buyerEmail}</div>
                      </td>
                      <td style={{ padding: '0.95rem 0.5rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                        {formatPrice(s.amount)}
                      </td>
                      <td style={{ padding: '0.95rem 0.5rem' }}>
                        <span style={{
                          backgroundColor: s.status === 'PAID' || s.status === 'COMPLETED' ? 'var(--sage-light)' : 'rgba(239, 68, 68, 0.08)',
                          color: s.status === 'PAID' || s.status === 'COMPLETED' ? 'var(--charcoal)' : '#991b1b',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          padding: '3px 9px',
                          borderRadius: 'var(--radius-pill)',
                          border: `1px solid ${s.status === 'PAID' || s.status === 'COMPLETED' ? 'var(--border-subtle)' : 'rgba(239, 68, 68, 0.25)'}`
                        }}>
                          {s.status === 'PAID' || s.status === 'COMPLETED' ? 'SUCCESS' : s.status === 'CANCELLED' ? 'FAILED' : 'PENDING'}
                        </span>
                      </td>
                      <td style={{ padding: '0.95rem 0.5rem' }}>
                        <span style={{
                          backgroundColor: s.status === 'COMPLETED' ? 'var(--warm-white)' : s.status === 'PAID' ? 'var(--sage-light)' : 'rgba(229, 161, 91, 0.1)',
                          color: s.status === 'COMPLETED' ? 'var(--text-muted)' : s.status === 'PAID' ? 'var(--charcoal)' : 'var(--accent-orange)',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          padding: '3px 9px',
                          borderRadius: 'var(--radius-pill)',
                          border: `1px solid ${s.status === 'COMPLETED' ? 'var(--border-subtle)' : s.status === 'PAID' ? 'var(--border-subtle)' : 'rgba(229, 161, 91, 0.4)'}`
                        }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.95rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={13} color="var(--muted-green)" />
                          <span>{s.pickupLocation || s.pickupNotes || 'Campus Landmark'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.95rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                        {formatDate(s.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
