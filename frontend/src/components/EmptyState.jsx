import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No items found',
  message = 'Try adjusting your search criteria or explore other categories on campus.',
  actionText,
  actionLink,
  onAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4.5rem 1.75rem',
        textAlign: 'center',
        background: 'var(--warm-white)',
        borderRadius: 'var(--radius-xl)',
        border: '1.5px dashed var(--border-subtle)',
        margin: '2rem 0',
      }}
    >
      <div
        style={{
          width: '68px',
          height: '68px',
          borderRadius: '20px',
          background: 'var(--sage-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--charcoal)',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <Icon size={32} />
      </div>
      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--charcoal)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--text-muted)', maxWidth: '440px', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
        {message}
      </p>
      {actionText && actionLink && (
        <Link to={actionLink} className="btn btn-primary btn-pill">
          {actionText}
        </Link>
      )}
      {actionText && onAction && !actionLink && (
        <button type="button" onClick={onAction} className="btn btn-primary btn-pill">
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
