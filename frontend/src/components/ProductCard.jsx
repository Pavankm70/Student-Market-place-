import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/formatters';
import { getCategoryPlaceholder, sanitizeImageUrl } from '../utils/constants';
import { User, MapPin, Tag, Heart, Navigation, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ProductCard = ({ listing, onRemoveFromWishlist }) => {
  const navigate = useNavigate();
  const { isSaved, toggleWishlist } = useWishlist();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();

  const fallbackImg = getCategoryPlaceholder(listing.category);
  const initialImg = sanitizeImageUrl(listing.imageUrl) || fallbackImg;
  const [imgSrc, setImgSrc] = useState(initialImg);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const clean = sanitizeImageUrl(listing.imageUrl);
    setImgSrc(clean || getCategoryPlaceholder(listing.category));
  }, [listing.imageUrl, listing.category]);

  const isSold = listing.status === 'SOLD';
  const isReserved = listing.status === 'RESERVED';
  const isArchived = listing.status === 'ARCHIVED';
  const saved = isSaved(listing.id);
  const isOwner = user?.id && Number(listing.sellerId || listing.sellerUserId) === Number(user.id);

  const handleHeartClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info('Please log in to save items to your wishlist');
      navigate('/login');
      return;
    }

    if (isOwner) {
      toast.info("This is your own listing! You don't need to add it to your wishlist.");
      return;
    }

    setSaving(true);
    try {
      await toggleWishlist(listing.id);
      if (onRemoveFromWishlist && saved) {
        onRemoveFromWishlist(listing.id);
      }
      if (!saved) {
        toast.success(`Saved "${listing.title}" to your wishlist!`);
      } else {
        toast.info(`Removed from your wishlist.`);
      }
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
      toast.error('Unable to update wishlist. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`product-card ${isSold ? 'sold-card' : ''} ${isArchived ? 'archived-card' : ''}`}>
      <div className="card-img-wrapper">
        <Link to={`/listings/${listing.id}`} className="card-img-link" tabIndex={-1}>
          <img
            src={imgSrc}
            alt={listing.title}
            className="card-img"
            referrerPolicy="no-referrer"
            onError={() => {
              if (imgSrc !== fallbackImg) {
                setImgSrc(fallbackImg);
              }
            }}
            loading="lazy"
          />
        </Link>

        {/* Status Badges */}
        {isSold && (
          <div className="sold-banner">
            SOLD
          </div>
        )}

        {isArchived && !isSold && (
          <div className="archived-banner">
            ARCHIVED
          </div>
        )}

        {isReserved && !isSold && !isArchived && (
          <div className="reserved-banner">
            RESERVED
          </div>
        )}

        {/* Wishlist Heart Button */}
        {!isOwner && (
          <button
            type="button"
            onClick={handleHeartClick}
            disabled={saving}
            className={`wishlist-heart-btn ${saved ? 'active' : ''}`}
            aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            title={saved ? 'Saved in Wishlist' : 'Save to Wishlist'}
          >
            <Heart
              size={16}
              fill={saved ? '#E5A15B' : 'none'}
              color={saved ? '#E5A15B' : '#747B72'}
              strokeWidth={saved ? 2.5 : 2}
            />
          </button>
        )}
      </div>

      <div className="card-body">
        {/* Category & Condition Row */}
        <div className="card-category">
          <span className="badge badge-category">
            <Tag size={11} /> {listing.categoryDisplayName || listing.category}
          </span>
          {listing.conditionType && (
            <span className="badge badge-condition">
              {listing.conditionType}
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3 className="card-title" title={listing.title}>
          <Link to={`/listings/${listing.id}`}>
            {listing.title}
          </Link>
        </h3>

        {/* Price & Location Distance */}
        <div className="card-price-row">
          <div className="card-price">
            {formatPrice(listing.price)}
          </div>
          {listing.distanceKm !== null && listing.distanceKm !== undefined && (
            <div
              className="card-distance-pill"
              title="Approximate distance on campus"
            >
              <Navigation size={11} /> ~{listing.distanceKm} km
            </div>
          )}
        </div>

        {/* Seller Info */}
        <div className="card-seller">
          <div className="seller-left">
            <div className="seller-avatar">
              <User size={12} />
            </div>
            <span className="seller-name">
              {listing.sellerName || 'Student Seller'}
            </span>
            {listing.sellerCollegeVerified && (
              <span title="Verified Campus Student" style={{ display: 'inline-flex', color: 'var(--success, #3E7B54)' }}>
                <ShieldCheck size={14} />
              </span>
            )}
          </div>
          {listing.sellerCampus && (
            <div className="seller-campus">
              <MapPin size={11} color="#9DA69B" />
              <span>{listing.sellerCampus}</span>
            </div>
          )}
        </div>

        {/* Quick Details Action */}
        <div className="card-action-wrap">
          <Link
            to={`/listings/${listing.id}`}
            className={`btn btn-sm ${isSold || isArchived ? 'btn-outline' : 'btn-primary'} card-view-btn`}
          >
            <span>{isSold ? 'View Archive' : isArchived ? 'View Archived' : 'View Details'}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <style>{`
        .product-card {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .card-img-link {
          display: block;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
        }
        .archived-banner {
          position: absolute;
          top: 12px;
          left: 12px;
          background-color: #747B72;
          color: #FFFFFF;
          padding: 0.32rem 0.8rem;
          border-radius: var(--radius-full);
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          box-shadow: var(--shadow-sm);
          z-index: 2;
        }
        .reserved-banner {
          position: absolute;
          top: 12px;
          left: 12px;
          background-color: var(--warning, #D9882E);
          color: #FFFFFF;
          padding: 0.32rem 0.8rem;
          border-radius: var(--radius-full);
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          box-shadow: var(--shadow-sm);
          z-index: 2;
        }
        .wishlist-heart-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(221, 227, 218, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, border-color 0.2s ease;
          box-shadow: 0 2px 6px rgba(32, 35, 31, 0.08);
          z-index: 3;
        }
        .wishlist-heart-btn:hover {
          transform: scale(1.1);
          background: #FFFFFF;
          border-color: var(--accent-orange, #E5A15B);
        }
        .wishlist-heart-btn.active {
          background: #FFF8F0;
          border-color: var(--accent-orange, #E5A15B);
        }
        .card-price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.85rem;
        }
        .card-distance-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.725rem;
          font-weight: 600;
          color: var(--text-muted, #747B72);
          background-color: var(--sage-light, #EDF2EB);
          padding: 2px 8px;
          border-radius: 6px;
          border: 1px solid var(--border-color, #DDE3DA);
        }
        .card-seller {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--text-muted, #747B72);
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-light, #E7ECE5);
          margin-top: auto;
        }
        .seller-left {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          overflow: hidden;
        }
        .seller-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: var(--sage-primary, #DCE7DC);
          color: var(--charcoal, #20231F);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .seller-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 600;
          color: var(--charcoal, #20231F);
          font-size: 0.8rem;
        }
        .seller-campus {
          display: flex;
          align-items: center;
          gap: 0.2rem;
          font-size: 0.725rem;
          color: var(--text-muted, #747B72);
          flex-shrink: 0;
        }
        .card-action-wrap {
          margin-top: 0.95rem;
        }
        .card-view-btn {
          width: 100%;
          border-radius: var(--radius-full);
          padding: 0.55rem 1rem;
          font-weight: 700;
          gap: 0.4rem;
        }
      `}</style>
    </div>
  );
};

export default ProductCard;
