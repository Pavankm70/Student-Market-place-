import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { listingService } from '../services/listingService';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatDate } from '../utils/formatters';
import { DEFAULT_PLACEHOLDER_IMAGE, getCategoryPlaceholder, sanitizeImageUrl } from '../utils/constants';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ContactSellerModal from '../components/ContactSellerModal';
import CheckoutModal from '../components/CheckoutModal';
import ListingDetailMap from '../components/ListingDetailMap';
import ReviewSection from '../components/ReviewSection';
import { useToast } from '../context/ToastContext';
import {
  Tag,
  MapPin,
  Calendar,
  User,
  Mail,
  Phone,
  Edit,
  Trash2,
  Archive,
  CheckCircle,
  MessageSquare,
  ArrowLeft,
  Book,
  ShieldCheck,
  AlertTriangle,
  Heart,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  Lock,
  Clock,
  X,
  Loader2
} from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isSaved, toggleWishlist } = useWishlist();
  const toast = useToast();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [savingWishlist, setSavingWishlist] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imgSrc, setImgSrc] = useState('');

  const saved = isSaved(id);

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.info('Please log in to save items to your wishlist');
      navigate('/login');
      return;
    }
    if (isOwner) {
      toast.info("This is your own listing! You don't need to add it to your wishlist.");
      return;
    }
    setSavingWishlist(true);
    try {
      await toggleWishlist(id);
      if (!saved) {
        toast.success(`Saved "${listing?.title}" to wishlist!`);
      } else {
        toast.info(`Removed from wishlist.`);
      }
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
      toast.error('Unable to update wishlist. Please try again.');
    } finally {
      setSavingWishlist(false);
    }
  };

  const fetchListing = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listingService.getListingById(id);
      setListing(data);
      const cleanImg = sanitizeImageUrl(data.imageUrl);
      setImgSrc(cleanImg || getCategoryPlaceholder(data.category));
    } catch (err) {
      console.error('Failed to load listing:', err);
      if (err.response && err.response.status === 404) {
        setError('This listing could not be found. It may have been deleted or archived by the seller.');
      } else {
        setError('Failed to load listing details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListing();
  }, [id]);

  const isOwner = Boolean(
    isAuthenticated &&
    user &&
    listing &&
    (user.id === listing.sellerId || user.email === listing.sellerEmail)
  );

  const isSold = listing?.status === 'SOLD';
  const isArchived = listing?.status === 'ARCHIVED';

  const handleMarkAsSold = async () => {
    setActionLoading(true);
    try {
      const updated = await listingService.markAsSold(listing.id);
      setListing(updated);
      toast.success('Listing marked as sold!');
    } catch (err) {
      console.error('Failed to mark sold:', err);
      toast.error(err.response?.data?.message || 'Failed to update status. Only the owner can mark it sold.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteListing = async () => {
    setActionLoading(true);
    try {
      const res = await listingService.deleteListing(listing.id);
      const wasArchived = res?.action === 'archived' || listing.hasOrderHistory || isSold;
      if (wasArchived) {
        toast.success(res?.message || 'Listing has order history and was safely archived.');
      } else {
        toast.success(res?.message || 'Listing permanently deleted.');
      }
      navigate('/my-listings');
    } catch (err) {
      console.error('Failed to delete listing:', err);
      let friendlyError = 'Failed to delete listing. Please try again.';
      if (err.response?.status === 403) {
        friendlyError = 'Only the verified seller has permission to manage this listing.';
      } else if (err.response?.data?.message) {
        friendlyError = err.response.data.message;
      }
      toast.error(friendlyError);
      setActionLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading listing details..." />;
  }

  if (error || !listing) {
    return (
      <div className="container" style={{ padding: '4rem 1rem' }}>
        <EmptyState
          title="Listing Not Found"
          message={error || 'Unable to locate this item.'}
          actionText="Back to Marketplace"
          actionLink="/browse"
        />
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ padding: '3rem 0 5rem 0', backgroundColor: 'var(--warm-white)', minHeight: '85vh' }}>
      <div className="container">
        {/* Back Link */}
        <div style={{ marginBottom: '2rem' }}>
          <Link
            to="/browse"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--charcoal)',
              fontWeight: 600,
              fontSize: '0.925rem',
              transition: 'transform 0.2s ease',
            }}
            className="back-btn-hover"
          >
            <ArrowLeft size={16} /> Back to Marketplace
          </Link>
        </div>

        {/* Main Product Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3.5rem',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Image Presentation & Safety */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative',
              }}
            >
              <img
                src={imgSrc}
                alt={listing.title}
                referrerPolicy="no-referrer"
                onError={() => {
                  const placeholder = getCategoryPlaceholder(listing?.category);
                  if (imgSrc !== placeholder) {
                    setImgSrc(placeholder);
                  }
                }}
                style={{
                  width: '100%',
                  maxHeight: '520px',
                  objectFit: 'contain',
                  backgroundColor: 'var(--warm-white)',
                  display: 'block',
                  padding: '1.5rem',
                }}
              />
              {isSold && (
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    backgroundColor: 'var(--charcoal)',
                    color: 'white',
                    padding: '0.5rem 1.25rem',
                    borderRadius: 'var(--radius-pill)',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    fontSize: '0.85rem',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  SOLD OUT
                </div>
              )}
              {isArchived && !isSold && (
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    backgroundColor: '#747B72',
                    color: 'white',
                    padding: '0.5rem 1.25rem',
                    borderRadius: 'var(--radius-pill)',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    fontSize: '0.85rem',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  ARCHIVED
                </div>
              )}
            </div>

            {/* Meetup Reminder Box */}
            <div
              style={{
                marginTop: '1.75rem',
                backgroundColor: 'var(--sage-light)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.35rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--charcoal)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--charcoal)', lineHeight: 1.5 }}>
                <strong style={{ display: 'block', marginBottom: '2px', fontSize: '0.9rem' }}>Campus Safe Meetup Guarantee:</strong>
                Always arrange handoffs in public university areas (Library lobby or Student Quad). Payments remain protected in escrow until you inspect the item!
              </div>
            </div>
          </div>

          {/* Right Column: Information, Seller Profile & Actions */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <span className="badge badge-category" style={{ fontSize: '0.825rem' }}>
                <Tag size={13} /> {listing.categoryDisplayName || listing.category}
              </span>
              {listing.conditionType && (
                <span className="badge badge-condition" style={{ fontSize: '0.825rem' }}>
                  Condition: {listing.conditionType}
                </span>
              )}
              {listing.status === 'SOLD' && (
                <span className="badge badge-sold" style={{ fontSize: '0.825rem' }}>
                  Status: SOLD
                </span>
              )}
              {listing.status === 'ARCHIVED' && (
                <span className="badge" style={{ fontSize: '0.825rem', backgroundColor: '#EDF2EB', color: '#747B72', border: '1px solid #DDE3DA' }}>
                  Status: ARCHIVED
                </span>
              )}
              {listing.status === 'RESERVED' && (
                <span className="badge badge-reserved" style={{ fontSize: '0.825rem' }}>
                  Status: RESERVED (HOLD)
                </span>
              )}
              {listing.status === 'AVAILABLE' && (
                <span className="badge badge-available" style={{ fontSize: '0.825rem' }}>
                  Status: AVAILABLE
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', letterSpacing: '-0.03em', lineHeight: 1.2, color: 'var(--charcoal)', fontWeight: 800 }}>
              {listing.title}
            </h1>

            {/* Price Banner */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: '0.5rem',
                fontSize: '2.75rem',
                fontWeight: 800,
                color: 'var(--charcoal)',
                marginBottom: '1.75rem',
                letterSpacing: '-0.03em',
              }}
            >
              {formatPrice(listing.price)}
            </div>

            {/* Book Metadata if Textbook */}
            {(listing.isbn || listing.author) && (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.5rem',
                  marginBottom: '1.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.75rem', fontSize: '0.925rem' }}>
                  <Book size={17} color="var(--muted-green)" /> Verified Textbook Specifications
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.9rem' }}>
                  {listing.author && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Author: </span>
                      <strong style={{ color: 'var(--charcoal)' }}>{listing.author}</strong>
                    </div>
                  )}
                  {listing.isbn && (
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>ISBN: </span>
                      <strong style={{ color: 'var(--charcoal)' }}>{listing.isbn}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.65rem', color: 'var(--charcoal)', fontWeight: 700 }}>
                Item Description
              </h3>
              <p style={{ whiteSpace: 'pre-line', color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '1rem' }}>
                {listing.description}
              </p>
            </div>

            {/* Listing Meta Info */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1.25rem',
                padding: '1.35rem',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '2rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--sage-light)', color: 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Listed Date</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--charcoal)' }}>{formatDate(listing.createdAt)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--sage-light)', color: 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pickup Landmark</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--charcoal)' }}>{listing.pickupLocation || 'Campus Quad'}</div>
                </div>
              </div>
            </div>

            {/* Seller Profile Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                marginBottom: '2.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, fontWeight: 700 }}>
                  Seller Profile
                </h4>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span style={{ backgroundColor: 'var(--sage-light)', color: 'var(--charcoal)', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)' }}>
                    Seller #{listing.sellerId}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--charcoal)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  <User size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--charcoal)', fontSize: '1.05rem' }}>{listing.sellerName}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{listing.sellerCampus || 'Campus Student'}</div>
                </div>
              </div>

              <div style={{ margin: '0.5rem 0 1rem 0', padding: '0.5rem 0.85rem', backgroundColor: 'var(--sage-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--charcoal)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <ShieldCheck size={16} color="var(--muted-green)" />
                <span style={{ fontWeight: 600 }}>Verified College Student Identity</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--charcoal)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={16} color="var(--muted-green)" /> {listing.sellerEmail}
                </div>
                {listing.sellerPhone && (
                  <div style={{ marginTop: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Phone size={16} color="var(--muted-green)" /> {listing.sellerPhone}
                    </div>
                    <a
                      href={`tel:${listing.sellerPhone}`}
                      className="btn btn-sm btn-outline btn-pill"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: '100%', justifyContent: 'center' }}
                    >
                      <Phone size={14} /> Call Seller Directly
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Buyer Interaction or Owner Action Controls */}
            {isOwner ? (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.25rem', color: 'var(--charcoal)' }}>
                  Seller Control Center (Your Listing)
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  You are authenticated as the verified owner of this item. You can edit, delete, or mark it sold.
                </div>

                {/* Buyer Inquiries summary */}
                <div
                  style={{
                    marginBottom: '1.25rem',
                    padding: '1rem',
                    backgroundColor: 'var(--warm-white)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare size={18} color="var(--charcoal)" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--charcoal)' }}>
                      {listing.inquiryCount > 0
                        ? `${listing.inquiryCount} Student ${listing.inquiryCount === 1 ? 'Inquiry' : 'Inquiries'} Received`
                        : '0 Student Inquiries Yet'}
                    </span>
                  </div>
                  <Link
                    to={`/messages?listingId=${listing.id}`}
                    className="btn btn-sm btn-primary btn-pill"
                  >
                    <MessageSquare size={14} />
                    <span>Open Messages</span>
                  </Link>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {!isSold && (
                    <button
                      type="button"
                      onClick={handleMarkAsSold}
                      disabled={actionLoading}
                      className="btn btn-success btn-pill"
                    >
                      <CheckCircle size={16} /> Mark as Sold
                    </button>
                  )}
                  <Link to={`/listings/${listing.id}/edit`} className="btn btn-outline btn-pill">
                    <Edit size={16} /> Edit Listing
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={actionLoading}
                    className="btn btn-danger btn-pill"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {isArchived ? (
                  <div
                    style={{
                      padding: '1.5rem',
                      backgroundColor: 'var(--sage-light)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 800, color: 'var(--charcoal)', marginBottom: '0.35rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                      <Archive size={18} /> This listing has been ARCHIVED
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                      The student seller has deactivated this item. It remains preserved for past order receipts, but is no longer available for new purchases.
                    </p>
                  </div>
                ) : isSold ? (
                  <div
                    style={{
                      padding: '1.5rem',
                      backgroundColor: 'var(--sage-light)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 800, color: 'var(--charcoal)', marginBottom: '0.35rem', fontSize: '1.05rem' }}>
                      This item has been SOLD
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                      The student seller has completed the exchange. Inquiries are disabled.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {listing.status === 'RESERVED' ? (
                      listing.reservedByCurrentBuyer ? (
                        <>
                          <div style={{
                            padding: '1.25rem',
                            background: 'var(--sage-light)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--charcoal)',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontWeight: 800, fontSize: '1rem' }}>Your Reservation Hold is Active</div>
                            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                              You reserved this item. Complete checkout before the 15-minute hold expires!
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowCheckoutModal(true)}
                            className="btn btn-lg btn-primary btn-pill"
                            style={{
                              width: '100%',
                              fontWeight: 700,
                            }}
                          >
                            <ShoppingBag size={20} />
                            <span>Resume Escrow Checkout</span>
                          </button>
                        </>
                      ) : (
                        <div style={{
                          padding: '1.25rem',
                          background: 'rgba(229, 161, 91, 0.1)',
                          border: '1px solid rgba(229, 161, 91, 0.4)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--charcoal)',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontWeight: 800, fontSize: '1rem' }}>Status: RESERVED (Temporary Hold)</div>
                          <div style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                            Another student is currently checking out this item. The hold will automatically release if unpaid after 15 minutes.
                          </div>
                        </div>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isAuthenticated) {
                            navigate('/login');
                            return;
                          }
                          setShowCheckoutModal(true);
                        }}
                        className="btn btn-lg btn-primary btn-pill"
                        style={{
                          width: '100%',
                          fontWeight: 800,
                          fontSize: '1.05rem',
                        }}
                      >
                        <ShoppingBag size={20} />
                        <span>Order / Buy Now (Safe Escrow)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowContactModal(true)}
                      className="btn btn-lg btn-outline btn-pill"
                      style={{
                        width: '100%',
                        fontWeight: 700,
                        fontSize: '1rem',
                      }}
                    >
                      <MessageSquare size={19} color="var(--charcoal)" />
                      <span>Chat with Seller / Send Inquiry</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleWishlist}
                      disabled={savingWishlist}
                      className="btn btn-lg btn-pill"
                      style={{
                        width: '100%',
                        fontSize: '1rem',
                        fontWeight: 700,
                        borderColor: saved ? 'var(--accent-orange)' : 'var(--border-subtle)',
                        color: saved ? '#ffffff' : 'var(--charcoal)',
                        backgroundColor: saved ? 'var(--accent-orange)' : '#ffffff',
                        border: '1.5px solid',
                        transition: 'all 0.22s ease',
                      }}
                    >
                      <Heart
                        size={19}
                        fill={saved ? '#ffffff' : 'none'}
                        color={saved ? '#ffffff' : 'var(--accent-orange)'}
                      />
                      <span>{saved ? 'Saved to Your Wishlist (Click to remove)' : 'Save to Wishlist'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Safe Campus Pickup Location Map */}
        <div style={{ marginTop: '3.5rem' }}>
          <ListingDetailMap
            latitude={listing.latitude}
            longitude={listing.longitude}
            pickupLocation={listing.pickupLocation}
            distanceKm={listing.distanceKm}
          />
        </div>

        {/* Student Reviews & Ratings */}
        <div style={{ marginTop: '3rem' }}>
          <ReviewSection
            listingId={listing.id}
            sellerId={listing.sellerId}
          />
        </div>
      </div>

      {/* Contact Seller Modal */}
      <ContactSellerModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        listing={listing}
      />

      {/* Checkout Escrow Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        listing={listing}
        onOrderSuccess={(order) => {
          setListing((prev) => ({ ...prev, status: 'RESERVED' }));
        }}
      />

      {/* Modern Delete / Archive Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowDeleteConfirm(false)}>
          <div className="modal-content" style={{ padding: '1.75rem' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: listing.hasOrderHistory || isSold ? 'var(--sage-primary)' : 'var(--danger-light)',
                  color: listing.hasOrderHistory || isSold ? 'var(--charcoal)' : 'var(--danger)',
                }}>
                  {listing.hasOrderHistory || isSold ? <Archive size={20} /> : <Trash2 size={20} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 2px 0', color: 'var(--charcoal)' }}>
                    {listing.hasOrderHistory || isSold ? 'Archive Listing' : 'Delete Listing'}
                  </h3>
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    {listing.hasOrderHistory || isSold ? 'Deactivate listing and preserve order history' : 'Permanently remove listing'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !actionLoading && setShowDeleteConfirm(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.85rem',
                background: 'var(--warm-white)',
                borderRadius: '14px',
                border: '1px solid var(--border-color)',
              }}>
                <img
                  src={imgSrc}
                  alt={listing.title}
                  style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '10px' }}
                />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--charcoal)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {listing.title}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                    {formatPrice(listing.price)}
                  </div>
                </div>
              </div>

              <div style={{
                padding: '1rem 1.15rem',
                borderRadius: '14px',
                fontSize: '0.885rem',
                lineHeight: 1.45,
                backgroundColor: listing.hasOrderHistory || isSold ? 'var(--sage-light)' : 'var(--danger-light)',
                border: listing.hasOrderHistory || isSold ? '1px solid var(--border-color)' : '1px solid var(--danger-border)',
                color: listing.hasOrderHistory || isSold ? 'var(--charcoal)' : 'var(--danger-text)',
              }}>
                {listing.hasOrderHistory || isSold ? (
                  <>
                    <strong>Safe Archival:</strong> This listing has historical transactions or orders. It will be safely archived and hidden from the public marketplace, while preserving buyer order receipts.
                  </>
                ) : (
                  <>
                    <strong>Permanent Deletion:</strong> This listing has no order history. It will be permanently removed from CampusLoop. This cannot be undone.
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-outline btn-pill"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteListing}
                className={`btn btn-pill ${listing.hasOrderHistory || isSold ? 'btn-primary' : 'btn-danger'}`}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={16} className="spin-icon" />
                    <span>Processing...</span>
                  </>
                ) : listing.hasOrderHistory || isSold ? (
                  <>
                    <Archive size={16} />
                    <span>Archive Listing</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .back-btn-hover:hover {
          transform: translateX(-4px);
        }
      `}</style>
    </div>
  );
};

export default ProductDetailPage;
