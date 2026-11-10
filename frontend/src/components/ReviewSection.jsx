import React, { useState, useEffect } from 'react';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import {
  Star,
  ShieldCheck,
  Flag,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Loader2,
  User,
  Sparkles,
} from 'lucide-react';

export default function ReviewSection({ listingId, sellerId }) {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Report Modal state
  const [reportingReviewId, setReportingReviewId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await reviewService.getListingReviews(listingId);
      setReviews(data || []);
    } catch (err) {
      console.warn('Could not fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (listingId) {
      fetchReviews();
    }
  }, [listingId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setFormError('Please log in to submit a review.');
      return;
    }
    if (!comment.trim()) {
      setFormError('Please enter a review description.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await reviewService.createReview({
        listingId: parseInt(listingId, 10),
        rating,
        comment: comment.trim(),
      });
      setFormSuccess('Thank you! Your verified review has been published.');
      setComment('');
      setRating(5);
      fetchReviews();
    } catch (err) {
      console.error('Failed to submit review:', err);
      setFormError(
        err.response?.data?.message ||
        'Only students who purchased this item can leave a review, or you may have already reviewed it.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason.trim() || !reportingReviewId) return;

    setReporting(true);
    try {
      await reviewService.reportReview(reportingReviewId, reportReason.trim());
      setReportSuccess('Review reported for Super Admin moderation. Thank you for keeping the campus community safe.');
      setReportingReviewId(null);
      setReportReason('');
    } catch (err) {
      console.error('Failed to report review:', err);
      alert(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setReporting(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const userAlreadyReviewed = Boolean(user?.id && reviews.some((r) => r.reviewerId === user.id));

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        padding: '2rem',
        marginTop: '2.5rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'var(--sage-light)',
              color: 'var(--accent-orange)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Star size={22} fill="var(--accent-orange)" color="var(--accent-orange)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>
              Verified Student Reviews
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ({reviews.length} {reviews.length === 1 ? 'peer review' : 'peer reviews'})
            </span>
          </div>
        </div>

        {avgRating ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>{avgRating}</span>
            <div>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    fill={s <= Math.round(avgRating) ? 'var(--accent-orange)' : 'none'}
                    color={s <= Math.round(avgRating) ? 'var(--accent-orange)' : 'var(--border-subtle)'}
                  />
                ))}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>out of 5 stars</span>
            </div>
          </div>
        ) : (
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No ratings submitted yet
          </span>
        )}
      </div>

      {/* Write a Review Section */}
      <div
        style={{
          background: 'var(--warm-white)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
          <Sparkles size={16} color="var(--muted-green)" />
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--charcoal)', letterSpacing: '-0.01em' }}>
            Write a Review (Verified Buyers)
          </h4>
        </div>
        <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          CampusLoop enforces authentic reviews: only students who purchased and completed this item order can post feedback.
        </p>

        {formSuccess && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--sage-light)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--charcoal)',
              fontSize: '0.9rem',
              marginBottom: '1.25rem',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={18} color="var(--muted-green)" />
            <span>{formSuccess}</span>
          </div>
        )}

        {formError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              fontSize: '0.9rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{formError}</span>
          </div>
        )}

        {userAlreadyReviewed ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--sage-light)',
              color: 'var(--charcoal)',
              fontSize: '0.925rem',
              fontWeight: 600,
              border: '1px solid var(--border-subtle)',
            }}
          >
            <CheckCircle2 size={20} color="var(--muted-green)" />
            <span>You have already submitted a verified review for this purchase. Thank you for your feedback!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview}>
            {/* Interactive Star Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--charcoal)' }}>Your Rating:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '2px',
                      cursor: 'pointer',
                      transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <Star
                      size={26}
                      fill={(hoverRating || rating) >= star ? 'var(--accent-orange)' : 'none'}
                      color={(hoverRating || rating) >= star ? 'var(--accent-orange)' : 'var(--border-subtle)'}
                    />
                  </button>
                ))}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginLeft: '0.5rem' }}>
                {rating === 5 ? '5 Stars — Excellent' : rating === 4 ? '4 Stars — Good' : rating === 3 ? '3 Stars — Average' : rating === 2 ? '2 Stars — Fair' : '1 Star — Poor'}
              </span>
            </div>

            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Share details about item condition, accuracy of description, and campus meetup experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={submitting}
              maxLength={1000}
              required
              style={{ width: '100%', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#FFFFFF' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="btn btn-primary btn-pill"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {submitting ? <Loader2 size={16} className="spin" /> : <MessageSquare size={16} />}
                Submit Verified Review
              </button>
            </div>
          </form>
        )}
      </div>

      {reportSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--sage-light)',
            color: 'var(--charcoal)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <CheckCircle2 size={16} color="var(--muted-green)" />
          <span>{reportSuccess}</span>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
          <Loader2 size={28} className="spin" style={{ margin: '0 auto 0.75rem auto' }} />
          <div style={{ fontWeight: 500 }}>Loading student reviews...</div>
        </div>
      ) : reviews.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '2.5rem 1.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.95rem',
          }}
        >
          No peer reviews yet for this listing. If you completed a purchase, feel free to be the first to leave feedback!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.map((r) => (
            <div
              key={r.id}
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--warm-white)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--sage-light)',
                        color: 'var(--charcoal)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      <User size={16} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--charcoal)' }}>
                      {r.buyerName || 'Campus Student'}
                    </span>
                    {r.verifiedPurchase && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          color: 'var(--charcoal)',
                          background: 'var(--sage-light)',
                          border: '1px solid var(--border-subtle)',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                        }}
                      >
                        <ShieldCheck size={12} color="var(--muted-green)" /> Verified Buyer
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          fill={s <= r.rating ? 'var(--accent-orange)' : 'none'}
                          color={s <= r.rating ? 'var(--accent-orange)' : 'var(--border-subtle)'}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                      • {formatDate(r.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Report button */}
                <button
                  type="button"
                  onClick={() => setReportingReviewId(r.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '6px',
                    borderRadius: '6px',
                  }}
                  title="Report inappropriate review"
                >
                  <Flag size={15} />
                </button>
              </div>

              <p
                style={{
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.925rem',
                  color: 'var(--charcoal)',
                  lineHeight: 1.6,
                }}
              >
                {r.comment}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {reportingReviewId && (
        <div
          className="modal-overlay"
          onClick={() => setReportingReviewId(null)}
          style={{ zIndex: 1060, backgroundColor: 'rgba(32, 35, 31, 0.45)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', borderRadius: 'var(--radius-xl)', padding: '1.75rem', backgroundColor: '#FFFFFF', border: '1px solid var(--border-subtle)' }}
          >
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, fontSize: '1.15rem', color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>
              Report Review to Admin
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
              Please specify why this review violates campus safety rules (e.g., abusive language, harassment, false accusations).
            </p>
            <form onSubmit={handleReportSubmit}>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Reason for reporting..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                required
                style={{ width: '100%', marginBottom: '1.25rem', borderRadius: 'var(--radius-sm)' }}
              />
              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setReportingReviewId(null)}
                  className="btn btn-sm btn-outline btn-pill"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reporting || !reportReason.trim()}
                  className="btn btn-sm btn-danger btn-pill"
                >
                  {reporting ? 'Reporting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
