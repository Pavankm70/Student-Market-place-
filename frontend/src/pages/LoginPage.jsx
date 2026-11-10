import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { LogIn, Mail, Lock, AlertCircle, GraduationCap, ArrowRight, ShieldCheck } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [unregisteredError, setUnregisteredError] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/browse';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both email and password');
      return;
    }

    setSubmitting(true);
    setError(null);
    setUnregisteredError(false);

    try {
      await login(email.trim().toLowerCase(), password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      if (!err.response) {
        setError('Cannot reach backend server. Please check your network connection.');
      } else {
        const msg = err.response?.data?.message || 'Invalid email or password. Please verify credentials.';
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="page-enter"
      style={{
        padding: '4.5rem 1rem 6rem 1rem',
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--warm-white)',
        backgroundImage: 'radial-gradient(ellipse at 50% 10%, rgba(220, 231, 220, 0.5) 0%, rgba(250, 250, 246, 0) 70%)',
      }}
    >
      <div style={{ maxWidth: '460px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
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
            Student Login
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.975rem' }}>
            Access your campus marketplace account, chats, and active listings
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
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.95rem 1.15rem',
                color: '#b91c1c',
                fontSize: '0.885rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginBottom: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
              {unregisteredError && (
                <Link
                  to="/register"
                  className="btn btn-sm btn-danger btn-pill"
                  style={{ alignSelf: 'flex-start', marginTop: '0.25rem', fontSize: '0.8rem' }}
                >
                  Create Account with Google &rarr;
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Student Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@nmit.ac.in"
                  className="form-input"
                  style={{ paddingLeft: '44px', borderRadius: 'var(--radius-sm)' }}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '44px', borderRadius: 'var(--radius-sm)' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-pill"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700 }}
              disabled={submitting}
            >
              {submitting ? 'Authenticating...' : (
                <>
                  <LogIn size={18} /> Log In
                </>
              )}
            </button>
          </form>

          {/* Google Sign-In Option */}
          <div style={{ margin: '1.75rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              or continue with Google
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
          </div>

          <GoogleSignInButton
            onSuccess={async (credential) => {
              setError(null);
              setUnregisteredError(false);
              try {
                await loginWithGoogle(credential);
                navigate(from, { replace: true });
              } catch (err) {
                if (err.response?.status === 404) {
                  setUnregisteredError(true);
                  setError(err.response?.data?.message || 'No CampusLoop account found for this Google email. Please register first.');
                } else {
                  setError(err.response?.data?.message || 'Google sign-in verification failed.');
                }
              }
            }}
            onError={(err) => setError(err)}
          />

          {/* Switch to Register */}
          <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.925rem', color: 'var(--text-muted)' }}>
            Don't have an account yet?{' '}
            <Link to="/register" style={{ color: 'var(--charcoal)', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
