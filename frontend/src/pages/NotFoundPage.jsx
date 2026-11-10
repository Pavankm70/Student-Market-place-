import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass, ArrowLeft, Search, Sparkles } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6rem 1.5rem',
        minHeight: '80vh',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(124, 58, 237, 0.08) 0%, #f8fafc 70%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '520px', zIndex: 1 }}>
        {/* Glowing 404 Number */}
        <div
          style={{
            fontSize: '8rem',
            fontWeight: 900,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 10px 25px rgba(99, 102, 241, 0.25))',
          }}
        >
          404
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '4px 14px',
            borderRadius: '9999px',
            backgroundColor: '#eef2ff',
            color: '#4338ca',
            fontSize: '0.8rem',
            fontWeight: 800,
            marginBottom: '1rem',
          }}
        >
          <Sparkles size={14} /> CAMPUS LOOP ROADBLOCK
        </div>

        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.75rem', color: '#0f172a', letterSpacing: '-0.03em' }}>
          Lost on Campus?
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          The page or marketplace listing you are looking for does not exist, was sold and archived, or was moved to another location.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            to="/"
            className="btn btn-outline btn-lg btn-pill"
            style={{
              padding: '0.75rem 1.75rem',
              fontWeight: 700,
              backgroundColor: '#ffffff',
              borderColor: '#cbd5e1',
              color: '#334155',
            }}
          >
            <Home size={18} /> Return Home
          </Link>
          <Link
            to="/browse"
            className="btn btn-primary btn-lg btn-pill"
            style={{
              padding: '0.75rem 2rem',
              fontWeight: 700,
              boxShadow: '0 8px 24px -4px rgba(79, 70, 229, 0.4)',
            }}
          >
            <Compass size={18} /> Explore Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
