import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import { formatPrice, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import AnimatedCounter from '../components/AnimatedCounter';
import { useToast } from '../context/ToastContext';
import {
  ShieldAlert,
  Users,
  Package,
  IndianRupee,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flag,
  UserCheck,
  ShieldCheck,
  Download,
  Mail,
  Send,
  Loader2,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'verifications' | 'reviews'
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [reportedReviews, setReportedReviews] = useState([]);
  const [emailDiag, setEmailDiag] = useState(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  // Suspension Modal State
  const [suspendTargetUser, setSuspendTargetUser] = useState(null);
  const [suspendingUser, setSuspendingUser] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [m, u, v, r, diag] = await Promise.all([
        dashboardService.getAdminMetrics(),
        dashboardService.getAllUsers(),
        dashboardService.getPendingVerifications(),
        dashboardService.getReportedReviews(),
        dashboardService.getEmailDiagnostics().catch(() => null),
      ]);
      setMetrics(m);
      setUsers(u || []);
      setVerifications(v || []);
      setReportedReviews(r || []);
      setEmailDiag(diag);
    } catch (err) {
      console.error('Failed to load Super Admin dashboard:', err);
      toast.error('Failed to load Super Admin dashboard records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await dashboardService.sendTestEmail();
      setEmailTestResult(res);
      setEmailDiag(res);
      toast.success('Test email ping submitted successfully.');
    } catch (err) {
      const errRes = {
        success: false,
        status: 'ERROR',
        message: err.response?.data?.message || err.message || 'Failed to submit test email.',
      };
      setEmailTestResult(errRes);
      toast.error(errRes.message);
    } finally {
      setTestingEmail(false);
    }
  };

  const handleConfirmToggleSuspend = async () => {
    if (!suspendTargetUser) return;
    const userId = suspendTargetUser.id;
    setSuspendingUser(true);
    setActionLoadingId(userId);
    try {
      const res = await dashboardService.toggleUserSuspension(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, suspended: res.suspended } : u))
      );
      const msg = `User account #${userId} (${suspendTargetUser.fullName}) is now ${res.suspended ? 'SUSPENDED' : 'ACTIVE'}.`;
      setActionMsg(msg);
      toast.info(msg);
      setSuspendTargetUser(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user suspension.');
    } finally {
      setSuspendingUser(false);
      setActionLoadingId(null);
    }
  };

  const handleReviewVerification = async (userId, approved) => {
    setActionLoadingId(userId);
    try {
      await dashboardService.reviewVerification(userId, approved);
      setVerifications((prev) => prev.filter((u) => u.id !== userId));
      const msg = `Student ID verification #${userId} was ${approved ? 'APPROVED' : 'REJECTED'}.`;
      setActionMsg(msg);
      toast.success(msg);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to review verification.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleModerateReview = async (reviewId, dismiss) => {
    setActionLoadingId(reviewId);
    try {
      await dashboardService.moderateReview(reviewId, dismiss);
      setReportedReviews((prev) => prev.filter((r) => r.id !== reviewId));
      const msg = `Report for review #${reviewId} was ${dismiss ? 'DISMISSED' : 'DELETED'}.`;
      setActionMsg(msg);
      toast.success(msg);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to moderate review.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExportCsv = async () => {
    try {
      await dashboardService.downloadTransactionsCsv();
      toast.success('Transactions CSV export initiated.');
    } catch (err) {
      toast.error('Failed to download transactions CSV.');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Super Admin controls & database records..." />;
  }

  return (
    <div style={{ padding: '3rem 0 5rem 0', minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      <div className="container" style={{ maxWidth: '1140px' }}>
        {/* Header Bar */}
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
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                marginBottom: '0.75rem',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
              }}
            >
              <ShieldAlert size={14} color="#f59e0b" /> SUPER ADMIN COMMAND PORTAL
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em', color: '#0f172a' }}>
              Platform Moderation &amp; <span className="text-gradient">Controls</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.975rem', margin: '0.35rem 0 0 0' }}>
              Monitor student transactions, approve college ID verifications, moderate flagged content, and audit safety logs.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="btn btn-outline btn-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              backgroundColor: '#ffffff',
              borderColor: '#cbd5e1',
              color: '#334155',
              padding: '0.65rem 1.25rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            }}
          >
            <Download size={16} /> Export Transactions CSV
          </button>
        </div>

        {/* Action Status Notification */}
        {actionMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '1rem 1.25rem',
              borderRadius: '14px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '0.925rem',
              marginBottom: '2rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)',
            }}
          >
            <CheckCircle2 size={20} color="#10b981" />
            <span>{actionMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '2px solid #e2e8f0',
            marginBottom: '2rem',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'overview', label: 'Overview Metrics', icon: Layers },
            { id: 'users', label: `Users (${users.length})`, icon: Users },
            { id: 'verifications', label: `Verifications (${verifications.length})`, icon: ShieldCheck },
            { id: 'reviews', label: `Reported Reviews (${reportedReviews.length})`, icon: Flag },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.4rem',
                  border: 'none',
                  background: 'none',
                  borderBottom: active ? '3px solid #4f46e5' : '3px solid transparent',
                  color: active ? '#4f46e5' : '#64748b',
                  fontWeight: active ? 800 : 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div
              className="stagger-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2rem',
              }}
            >
              <div
                className="card"
                style={{
                  padding: '1.5rem',
                  borderRadius: '18px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Registered Users</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a' }}>
                  <AnimatedCounter value={metrics?.totalUsers || 0} />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: 600, marginTop: '4px' }}>
                  {metrics?.verifiedUsersCount || 0} College Verified
                </div>
              </div>

              <div
                className="card"
                style={{
                  padding: '1.5rem',
                  borderRadius: '18px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Marketplace Listings</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a' }}>
                  <AnimatedCounter value={metrics?.totalListings || 0} />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600, marginTop: '4px' }}>
                  {metrics?.availableCount || 0} Available • {metrics?.soldCount || 0} Sold
                </div>
              </div>

              <div
                className="card"
                style={{
                  padding: '1.5rem',
                  borderRadius: '18px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Platform GMV / Sales</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IndianRupee size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a' }}>
                  <AnimatedCounter value={metrics?.totalRevenue || 0} prefix="₹" />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                  {metrics?.totalOrders || 0} Escrow Orders Placed
                </div>
              </div>

              <div
                className="card"
                style={{
                  padding: '1.5rem',
                  borderRadius: '18px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Moderation Queue</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a' }}>
                  <AnimatedCounter value={(metrics?.pendingVerifications || 0) + (metrics?.reportedReviewsCount || 0)} />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600, marginTop: '4px' }}>
                  {metrics?.pendingVerifications || 0} Pending IDs • {metrics?.reportedReviewsCount || 0} Flagged
                </div>
              </div>
            </div>

            {/* Gmail SMTP Diagnostic & Connectivity Panel */}
            <div
              className="card"
              style={{
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                padding: '1.5rem 1.75rem',
                marginBottom: '2rem',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: emailDiag?.status === 'SUCCESS' || emailDiag?.status === 'CONFIGURED' ? '#ecfdf5' : '#fef2f2',
                      color: emailDiag?.status === 'SUCCESS' || emailDiag?.status === 'CONFIGURED' ? '#059669' : '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Mail size={22} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      Gmail SMTP Campus Notification Gateway
                    </h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                      Host: {emailDiag?.host || 'smtp.gmail.com'}:{emailDiag?.port || 465} • Account: {emailDiag?.maskedUsername || 'Active Server Config'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      backgroundColor: emailDiag?.status === 'SUCCESS' || emailDiag?.status === 'CONFIGURED' ? '#dcfce7' : '#fee2e2',
                      color: emailDiag?.status === 'SUCCESS' || emailDiag?.status === 'CONFIGURED' ? '#15803d' : '#991b1b',
                    }}
                  >
                    {emailDiag?.status || 'CONFIGURED'}
                  </span>

                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testingEmail}
                    className="btn btn-outline btn-sm btn-pill"
                    style={{ fontSize: '0.825rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}
                  >
                    {testingEmail ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                    {testingEmail ? 'Testing Connection...' : 'Send Test Ping'}
                  </button>
                </div>
              </div>

              {emailTestResult && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '0.85rem 1.15rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    background: emailTestResult.success ? '#ecfdf5' : '#fef2f2',
                    color: emailTestResult.success ? '#065f46' : '#991b1b',
                    border: `1px solid ${emailTestResult.success ? '#a7f3d0' : '#fecaca'}`,
                  }}
                >
                  <strong>{emailTestResult.status}:</strong> {emailTestResult.message}
                </div>
              )}
            </div>

            {/* Super Admin Security Cards */}
            <div
              className="card"
              style={{
                padding: '1.75rem',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Spring Security &amp; Compliance Enforcement
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                All sensitive mutation routes require validated JWT tokens signed by the backend authorization server.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Google Sign-In:</span> Server-side token signature, issuer, and audience validation.
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Payment Signatures:</span> HMAC-SHA256 signature verification protects Escrow funds.
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Review Guard:</span> Only confirmed buyer accounts may post ratings.
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Privacy Shield:</span> Campus coordinates only; private contact data is restricted.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS */}
        {activeTab === 'users' && (
          <div
            className="card"
            style={{
              padding: '1.75rem',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
            }}
          >
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              User Accounts &amp; Access Controls
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.75rem' }}>ID</th>
                    <th style={{ padding: '0.75rem' }}>Student Name</th>
                    <th style={{ padding: '0.75rem' }}>Email Address</th>
                    <th style={{ padding: '0.75rem' }}>Campus Domain</th>
                    <th style={{ padding: '0.75rem' }}>Security Role</th>
                    <th style={{ padding: '0.75rem' }}>Verification</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: '#4f46e5' }}>#{u.id}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{u.fullName}</td>
                      <td style={{ padding: '0.75rem', color: '#475569' }}>{u.email}</td>
                      <td style={{ padding: '0.75rem', color: '#64748b' }}>{u.collegeName || 'NMIT Campus'}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            background: u.role === 'ROLE_SUPER_ADMIN' ? 'linear-gradient(135deg, #0f172a 0%, #312e81 100%)' : '#f1f5f9',
                            color: u.role === 'ROLE_SUPER_ADMIN' ? '#ffffff' : '#334155',
                            fontWeight: 700,
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            background: u.collegeVerified ? '#ecfdf5' : '#fffbeb',
                            color: u.collegeVerified ? '#065f46' : '#92400e',
                            fontWeight: 700,
                          }}
                        >
                          {u.collegeVerified ? 'VERIFIED' : u.verificationStatus || 'UNVERIFIED'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            background: u.suspended ? '#fef2f2' : '#ecfdf5',
                            color: u.suspended ? '#991b1b' : '#065f46',
                            fontWeight: 700,
                          }}
                        >
                          {u.suspended ? 'SUSPENDED' : 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {u.role !== 'ROLE_SUPER_ADMIN' && (
                          <button
                            type="button"
                            onClick={() => setSuspendTargetUser(u)}
                            disabled={actionLoadingId === u.id}
                            className={`btn btn-sm btn-pill ${u.suspended ? 'btn-outline' : 'btn-danger'}`}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', fontWeight: 700 }}
                          >
                            {u.suspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: VERIFICATIONS */}
        {activeTab === 'verifications' && (
          <div
            className="card"
            style={{
              padding: '1.75rem',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
            }}
          >
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Student ID Document Verification Queue
            </h3>
            {verifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748b' }}>
                <ShieldCheck size={48} color="#10b981" style={{ marginBottom: '0.75rem', display: 'inline-block' }} />
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>All Clear!</div>
                <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '4px' }}>
                  No student ID verification requests currently awaiting administrative approval.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {verifications.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1.25rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                        {v.fullName} <span style={{ color: '#4f46e5' }}>(#{v.id})</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                        Email: {v.email} • Campus: {v.collegeName || 'NMIT'}
                      </div>
                      <div style={{ fontSize: '0.825rem', color: '#4f46e5', marginTop: '4px', fontWeight: 600 }}>
                        ID Document Reference: {v.idCardUrl || 'Submitted via Student Settings'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                      <button
                        type="button"
                        onClick={() => handleReviewVerification(v.id, true)}
                        disabled={actionLoadingId === v.id}
                        className="btn btn-sm btn-pill"
                        style={{ backgroundColor: '#10b981', color: '#ffffff', fontWeight: 700, padding: '0.45rem 1rem' }}
                      >
                        <CheckCircle2 size={15} /> Approve Verified Badge
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewVerification(v.id, false)}
                        disabled={actionLoadingId === v.id}
                        className="btn btn-sm btn-outline btn-pill"
                        style={{ color: '#ef4444', borderColor: '#fca5a5', fontWeight: 700, padding: '0.45rem 1rem' }}
                      >
                        <XCircle size={15} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REPORTED REVIEWS */}
        {activeTab === 'reviews' && (
          <div
            className="card"
            style={{
              padding: '1.75rem',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
            }}
          >
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Flagged Reviews Moderation Desk
            </h3>
            {reportedReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748b' }}>
                <CheckCircle2 size={48} color="#10b981" style={{ marginBottom: '0.75rem', display: 'inline-block' }} />
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>No Flagged Content</div>
                <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '4px' }}>
                  No student reviews are currently flagged for policy or conduct violations.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reportedReviews.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: '1.25rem',
                      border: '1px solid #fecaca',
                      background: '#fff1f2',
                      borderRadius: '16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#991b1b' }}>
                          Review #{r.id} on Listing #{r.listingId}
                        </span>
                        <div style={{ fontSize: '0.85rem', color: '#b91c1c', marginTop: '0.2rem' }}>
                          Report Reason: <strong>{r.reportReason || 'Flagged by student community'}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleModerateReview(r.id, true)}
                          disabled={actionLoadingId === r.id}
                          className="btn btn-sm btn-outline btn-pill"
                          style={{ fontSize: '0.8rem', fontWeight: 700 }}
                        >
                          Dismiss (Keep Review)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModerateReview(r.id, false)}
                          disabled={actionLoadingId === r.id}
                          className="btn btn-sm btn-danger btn-pill"
                          style={{ fontSize: '0.8rem', fontWeight: 700 }}
                        >
                          Delete Violating Review
                        </button>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        color: '#334155',
                        padding: '0.85rem',
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #fed7aa',
                      }}
                    >
                      "{r.comment}" — Rating: {r.rating}★ by {r.buyerName || 'Buyer'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modern User Suspension Confirmation Modal */}
        {suspendTargetUser && (
          <div className="modal-overlay" onClick={() => !suspendingUser && setSuspendTargetUser(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
              <div className="modal-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    {suspendTargetUser.suspended ? 'Unsuspend Student Account' : 'Suspend Student Account'}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                    User #{suspendTargetUser.id} • {suspendTargetUser.fullName}
                  </div>
                </div>
              </div>

              <div className="modal-body">
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    backgroundColor: suspendTargetUser.suspended ? '#ecfdf5' : '#fef2f2',
                    border: `1px solid ${suspendTargetUser.suspended ? '#a7f3d0' : '#fecaca'}`,
                    color: suspendTargetUser.suspended ? '#065f46' : '#991b1b',
                    fontSize: '0.875rem',
                    lineHeight: 1.55,
                    marginBottom: '1.5rem',
                  }}
                >
                  {suspendTargetUser.suspended ? (
                    <span>
                      Are you sure you want to restore full campus access for <strong>{suspendTargetUser.fullName}</strong> ({suspendTargetUser.email})? The user will be able to browse, purchase, and list items again.
                    </span>
                  ) : (
                    <span>
                      Are you sure you want to suspend <strong>{suspendTargetUser.fullName}</strong> ({suspendTargetUser.email})? When suspended, this student cannot create listings or initiate new campus purchases.
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setSuspendTargetUser(null)}
                    disabled={suspendingUser}
                    className="btn btn-outline btn-pill"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmToggleSuspend}
                    disabled={suspendingUser}
                    className={`btn btn-pill ${suspendTargetUser.suspended ? 'btn-primary' : 'btn-danger'}`}
                    style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                  >
                    {suspendingUser ? <Loader2 size={15} className="spin" /> : null}
                    <span>{suspendingUser ? 'Processing...' : suspendTargetUser.suspended ? 'Yes, Unsuspend' : 'Yes, Suspend Account'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
