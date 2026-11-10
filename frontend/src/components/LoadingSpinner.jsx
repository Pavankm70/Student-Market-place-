import React from 'react';

const LoadingSpinner = ({ message = 'Loading campus marketplace...' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
      <div style={{ position: 'relative', width: '44px', height: '44px' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid var(--border-subtle)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: 'var(--charcoal)',
            borderRightColor: 'var(--muted-green)',
            animation: 'spin 0.75s linear infinite',
          }}
        />
      </div>
      {message && (
        <p
          style={{
            marginTop: '1.25rem',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
