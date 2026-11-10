import React, { useState } from 'react';
import { bookService } from '../services/bookService';
import { Search, X, Book, Check, AlertCircle, Loader2 } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const BookLookupModal = ({ isOpen, onClose, onSelectBook }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const data = await bookService.lookupBook(query);
      setResults(data || []);
    } catch (err) {
      console.error('Book lookup failed:', err);
      setError('External book lookup service is currently slow or unreachable. You can continue filling details manually.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChoose = (book) => {
    onSelectBook(book);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 1050,
        backgroundColor: 'rgba(32, 35, 31, 0.45)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '680px',
          width: '92%',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: '#FFFFFF',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-subtle)',
          padding: '2rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
              <Book size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>
                Google Books Auto-Fill
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Search by book title or 10/13-digit ISBN to instantly pull covers &amp; metadata
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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

        <div style={{ padding: '1.5rem 0 0 0' }}>
          {/* Search Bar */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 300px' }}>
              <Search
                size={18}
                color="var(--muted-green)"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="form-input"
                style={{ height: '48px', paddingLeft: '42px', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem' }}
                placeholder="e.g. Introduction to Algorithms or 9780262046305"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0 1.5rem',
                height: '48px',
              }}
              disabled={loading || !query.trim()}
            >
              {loading ? <Loader2 size={16} className="spin" /> : <Search size={16} />} Search
            </button>
          </form>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                backgroundColor: 'var(--sage-light)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem 1rem',
                color: 'var(--charcoal)',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              <AlertCircle size={18} color="var(--accent-orange)" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Spinner */}
          {loading && <LoadingSpinner message="Searching Google Books database..." />}

          {/* Results List */}
          {!loading && searched && results.length === 0 && !error && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <p style={{ fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.35rem', fontSize: '1.05rem' }}>No matches found</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Check your spelling or ISBN digits, or enter your textbook information manually.</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '420px', overflowY: 'auto' }}>
              {results.map((book, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--warm-white)',
                    alignItems: 'center',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  {/* Thumbnail */}
                  {book.coverImageUrl ? (
                    <img
                      src={book.coverImageUrl}
                      alt={book.title}
                      referrerPolicy="no-referrer"
                      style={{
                        width: '56px',
                        height: '78px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        flexShrink: 0,
                      }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '56px',
                        height: '78px',
                        backgroundColor: 'var(--sage-light)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--muted-green)',
                        flexShrink: 0,
                      }}
                    >
                      <Book size={24} />
                    </div>
                  )}

                  {/* Metadata */}
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        fontSize: '0.975rem',
                        fontWeight: 700,
                        color: 'var(--charcoal)',
                        marginBottom: '0.25rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {book.title}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.35rem 0' }}>
                      By: <strong style={{ color: 'var(--charcoal)' }}>{book.author || 'Unknown Author'}</strong>
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {book.isbn && <span style={{ backgroundColor: '#ffffff', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>ISBN: {book.isbn}</span>}
                      {book.publisher && <span>• {book.publisher}</span>}
                    </div>
                  </div>

                  {/* Select Button */}
                  <button
                    type="button"
                    onClick={() => handleChoose(book)}
                    className="btn btn-sm btn-primary btn-pill"
                    style={{ flexShrink: 0 }}
                  >
                    <Check size={14} /> Auto-fill
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            marginTop: '1.25rem',
          }}
        >
          <button type="button" onClick={onClose} className="btn btn-outline btn-pill">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookLookupModal;
