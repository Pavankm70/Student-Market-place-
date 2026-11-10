import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import {
  AlertCircle,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const RegisterPage = () => {
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { registerWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credential) => {
    setLoading(true);
    setServerError(null);
    try {
      await registerWithGoogle(credential);
      navigate('/browse');
    } catch (err) {
      console.error('Registration failed:', err);
      const msg = err.response?.data?.message || 'Google registration verification failed.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page-enter"
      style={{
        padding: '4rem 1rem 6rem 1rem',
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--warm-white)',
        backgroundImage: 'radial-gradient(ellipse at 50% 10%, rgba(220, 231, 220, 0.5) 0%, rgba(250, 250, 246, 0) 70%)',
      }}
    >
      <div style={{ maxWidth: '500px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--charcoal)',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
              marginBottom: '1.25rem',
            }}
          >
            <GraduationCap size={30} />
          </div>
          <h1 style={{ fontSize: '2.25rem', letterSpacing: '-0.03em', marginBottom: '0.45rem', color: 'var(--charcoal)', fontWeight: 800 }}>
            Join CampusLoop
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.975rem' }}>
            Create your verified student account with Google Identity in seconds
          </p>
        </div>

        {/* Card */}
        <div
          className="card"
          style={{
            padding: '2.5rem',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: '#ffffff',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {serverError && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.95rem 1.15rem',
                color: '#b91c1c',
                fontSize: '0.885rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.75rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{serverError}</span>
            </div>
          )}

          {/* Benefits list */}
          <div
            style={{
              marginBottom: '2rem',
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--sage-light)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--charcoal)', fontWeight: 700, fontSize: '0.95rem' }}>
              <ShieldCheck size={20} color="var(--muted-green)" />
              <span>Verified University Marketplace</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <li>Direct verified Google account authentication</li>
              <li>Protected transactions with Razorpay Escrow</li>
              <li>Real-time automated email receipts and notifications</li>
              <li>Safe peer-to-peer campus meeting points</li>
            </ul>
          </div>

          {/* Google Sign-Up Button */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.75rem', textAlign: 'center' }}>
              Continue with Google Account
            </label>
            <GoogleSignInButton
              text="signup_with"
              onSuccess={handleGoogleSuccess}
              onError={(err) => setServerError(err)}
            />
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '1rem' }}>
            By registering, you agree to CampusLoop marketplace student terms. Direct password sign-ups are restricted to ensure all accounts have verified email identities.
          </div>

          {/* Switch to Login */}
          <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.925rem', color: 'var(--text-muted)' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--charcoal)', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
