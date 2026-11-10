import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wishlistService } from '../services/wishlistService';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Heart, ArrowLeft, ShoppingBag, Sparkles, AlertCircle } from 'lucide-react';

const WishlistPage = () => {
  const { refreshWishlist } = useWishlist();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await wishlistService.getWishlist();
      setListings(data || []);
      refreshWishlist();
    } catch (err) {
      console.error('Failed to load wishlist:', err);
      setError('Could not load your saved listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemoveFromWishlist = (listingId) => {
    setListings((prev) => prev.filter((item) => item.id !== listingId));
    refreshWishlist();
  };

  return (
    <div className="page-enter" style={{ padding: '3rem 0 5rem 0', minHeight: '85vh', backgroundColor: 'var(--warm-white)' }}>
      <div className="container">
        {/* Back Link */}
        <div style={{ marginBottom: '1.75rem' }}>
          <Link
            to="/browse"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--charcoal)',
              fontSize: '0.925rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'transform 0.2s ease',
            }}
            className="back-btn-hover"
          >
            <ArrowLeft size={16} /> Back to Marketplace
          </Link>
        </div>

        {/* Page Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            marginBottom: '2.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.45rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(229, 161, 91, 0.15)',
                  color: 'var(--accent-orange)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Heart size={22} fill="var(--accent-orange)" />
              </div>
              <h1 style={{ fontSize: '2.5rem', margin: 0, letterSpacing: '-0.03em', color: 'var(--charcoal)', fontWeight: 800, lineHeight: 1.15 }}>
                Saved Listings &amp; Wishlist
              </h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: 0, lineHeight: 1.5 }}>
              Keep track of items you plan to buy or want to compare across student sellers.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span
              style={{
                backgroundColor: 'var(--sage-light)',
                color: 'var(--charcoal)',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {listings.length} Saved {listings.length === 1 ? 'Item' : 'Items'}
            </span>
            <Link to="/browse" className="btn btn-primary btn-sm btn-pill">
              <ShoppingBag size={15} /> Find More Items
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem 1.25rem',
              color: '#b91c1c',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginBottom: '2rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div style={{ padding: '4rem 0' }}>
            <LoadingSpinner message="Loading your saved wishlist..." />
          </div>
        ) : listings.length === 0 ? (
          /* Empty State */
          <div
            className="card"
            style={{
              padding: '4.5rem 2rem',
              textAlign: 'center',
              maxWidth: '580px',
              margin: '2rem auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 'var(--radius-xl)',
              border: '1.5px dashed var(--border-subtle)',
              backgroundColor: '#ffffff',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: 'rgba(229, 161, 91, 0.15)',
                color: 'var(--accent-orange)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <Heart size={38} color="var(--accent-orange)" fill="var(--accent-orange)" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--charcoal)', fontWeight: 800 }}>
              Your Wishlist is Empty
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '440px', marginBottom: '2rem', lineHeight: 1.6 }}>
              Explore textbooks, electronics, dorm gear, and lab supplies. Click the heart icon on any listing to save it here for later!
            </p>
            <Link to="/browse" className="btn btn-primary btn-lg btn-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} /> Browse Marketplace
            </Link>
          </div>
        ) : (
          /* Saved Listings Grid */
          <div className="grid-listings stagger-grid">
            {listings.map((item) => (
              <ProductCard
                key={item.id}
                listing={item}
                onRemoveFromWishlist={handleRemoveFromWishlist}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .back-btn-hover:hover {
          transform: translateX(-4px);
        }
      `}</style>
    </div>
  );
};

export default WishlistPage;
