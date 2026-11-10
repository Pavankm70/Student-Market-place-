import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { listingService } from '../services/listingService';
import { formatDate } from '../utils/formatters';
import AnimatedCounter from '../components/AnimatedCounter';
import { useToast } from '../context/ToastContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Package,
  CheckCheck,
  Sparkles,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [phone, setPhone] = useState(user?.phone || '');
  const [campusName, setCampusName] = useState(user?.campusName || 'Main Campus');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [stats, setStats] = useState({ total: 0, available: 0, sold: 0 });

  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
      setCampusName(user.campusName || 'Main Campus');
    }

    // Load user listings stats
    const fetchStats = async () => {
      try {
        const myListings = await listingService.getMyListings();
        const total = myListings.length;
        const available = myListings.filter((l) => l.status === 'AVAILABLE').length;
        const sold = myListings.filter((l) => l.status === 'SOLD').length;
        setStats({ total, available, sold });
      } catch (err) {
        console.warn('Could not load profile stats:', err);
      }
    };

    fetchStats();
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (phone.trim() && cleanPhone.length !== 10) {
      const err = 'Phone number must be exactly 10 digits (e.g. 9876543210)';
      setErrorMsg(err);
      toast.error(err);
      return;
    }

    setSaving(true);

    try {
      const updated = await authService.updateProfile({ phone: cleanPhone, campusName: campusName.trim() });
      updateUser(updated);
      setSuccessMsg('Profile updated successfully!');
      toast.success('Your student profile was updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      const msg = err.response?.data?.message || 'Failed to update profile.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-enter" style={{ padding: '3.5rem 0 5rem 0', minHeight: '85vh', backgroundColor: 'var(--warm-white)' }}>
      <div className="container" style={{ maxWidth: '880px' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'var(--sage-light)', color: 'var(--charcoal)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
            <User size={14} color="var(--muted-green)" /> Student Profile &amp; Settings
          </div>
          <h1 style={{ fontSize: '2.5rem', letterSpacing: '-0.03em', marginBottom: '0.45rem', fontWeight: 800, color: 'var(--charcoal)', lineHeight: 1.15 }}>
            Account Settings
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: 0, lineHeight: 1.5 }}>
            Manage your campus contact details, pickup quad preferences, and view your seller activity.
          </p>
        </div>

        {/* Stats Grid */}
        <div
          className="stagger-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2.5rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ color: 'var(--charcoal)', marginBottom: '0.65rem', display: 'flex', justifyContent: 'center' }}>
              <Package size={28} />
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--charcoal)' }}>
              <AnimatedCounter value={stats.total} />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Listings</div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ color: 'var(--muted-green)', marginBottom: '0.65rem', display: 'flex', justifyContent: 'center' }}>
              <Sparkles size={28} />
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--charcoal)' }}>
              <AnimatedCounter value={stats.available} />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Listings</div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ color: 'var(--accent-orange)', marginBottom: '0.65rem', display: 'flex', justifyContent: 'center' }}>
              <CheckCheck size={28} />
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--charcoal)' }}>
              <AnimatedCounter value={stats.sold} />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sold Exchanges</div>
          </div>
        </div>

        {/* Profile Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            padding: '2.5rem',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          {successMsg && (
            <div
              style={{
                backgroundColor: 'var(--sage-light)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.95rem 1.15rem',
                color: 'var(--charcoal)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                marginBottom: '1.75rem',
              }}
            >
              <CheckCircle2 size={18} color="var(--muted-green)" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.95rem 1.15rem',
                color: '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                marginBottom: '1.75rem',
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Account Details Reference Banner */}
          <div
            style={{
              backgroundColor: 'var(--warm-white)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--charcoal)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  STUDENT ID CARD
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.2rem 0 0 0', color: 'var(--charcoal)' }}>
                  Member Verification Credentials
                </h3>
              </div>
              <span
                style={{
                  background: 'var(--sage-light)',
                  color: 'var(--charcoal)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--border-subtle)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <ShieldCheck size={16} color="var(--muted-green)" /> Verified College Student
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>USER ID</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--charcoal)', marginTop: '2px' }}>#{user?.id || '—'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-green)', fontWeight: 600, marginTop: '0.25rem' }}>● Buyer Identity</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>SELLER ID (Auto-Linked)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--charcoal)', marginTop: '2px' }}>#{user?.sellerId || user?.id || '—'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--charcoal)', fontWeight: 600, marginTop: '0.25rem' }}>● Verified Seller Identity</div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              Your account allows you to browse, reserve items, and post student listings. All created listings are automatically verified with your Seller ID (#{user?.sellerId || user?.id}).
            </p>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Full Name (Readonly) */}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={user?.name || ''}
                    disabled
                    className="form-input"
                    style={{ paddingLeft: '42px', backgroundColor: 'var(--warm-white)', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
              </div>

              {/* Email (Readonly) */}
              <div className="form-group">
                <label className="form-label">Google Student Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="form-input"
                    style={{ paddingLeft: '42px', backgroundColor: 'var(--warm-white)', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Phone */}
              <div className="form-group">
                <label className="form-label">Contact Phone Number (10 Digits)</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    className="form-input"
                    style={{ paddingLeft: '42px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
                <div className="form-hint">Displayed to students inquiring about your active listings for easy handoffs</div>
              </div>

              {/* Campus Location */}
              <div className="form-group">
                <label className="form-label">Primary Campus / Residence Landmark</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={campusName}
                    onChange={(e) => setCampusName(e.target.value)}
                    placeholder="e.g. North Campus, Engineering Library, West Dorms"
                    className="form-input"
                    style={{ paddingLeft: '42px', borderRadius: 'var(--radius-sm)' }}
                  />
                </div>
                <div className="form-hint">Helps student buyers estimate proximity for in-person handoffs</div>
              </div>
            </div>

            {/* Account Info Bar */}
            <div
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--warm-white)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                marginBottom: '2rem',
              }}
            >
              <Calendar size={17} color="var(--muted-green)" />
              <span>CampusLoop verified student member since: <strong style={{ color: 'var(--charcoal)' }}>{formatDate(user?.createdAt)}</strong></span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <Link to="/my-listings" className="btn btn-outline btn-pill">
                <Package size={16} /> Manage My Listings
              </Link>

              <button
                type="submit"
                className="btn btn-primary btn-pill"
                disabled={saving}
                style={{ fontWeight: 700, padding: '0.75rem 1.75rem' }}
              >
                {saving ? 'Saving...' : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
