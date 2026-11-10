import React, { useState } from 'react';
import { listingService } from '../services/listingService';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, X, Send, Mail, Phone, MapPin, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ContactSellerModal = ({ isOpen, onClose, listing }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [message, setMessage] = useState('Hi! I am interested in your listing. Is it still available to meet on campus?');
  const [contactInfo, setContactInfo] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdInquiryId, setCreatedInquiryId] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen || !listing) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const resp = await listingService.sendInquiry(listing.id, {
        message: message.trim(),
        contactInfo: contactInfo.trim(),
      });
      if (resp?.id) {
        setCreatedInquiryId(resp.id);
      }
      setSuccess(true);
    } catch (err) {
      console.error('Failed to send inquiry:', err);
      const msg = err.response?.data?.message || 'Failed to send inquiry. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError(null);
    setCreatedInquiryId(null);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      style={{
        zIndex: 1050,
        backgroundColor: 'rgba(32, 35, 31, 0.45)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '92%',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: '#FFFFFF',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-subtle)',
          padding: '2rem',
        }}
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
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>
                Contact Seller
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Regarding: {listing.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
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

        <div style={{ padding: '1.25rem 0 0 0' }}>
          {/* Seller Direct Info */}
          <div
            style={{
              backgroundColor: 'var(--sage-light)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.15rem',
              marginBottom: '1.25rem',
            }}
          >
            <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Seller Contact Details
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--charcoal)', fontSize: '1rem' }}>{listing.sellerName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <Mail size={15} color="var(--muted-green)" /> <span>{listing.sellerEmail}</span>
              </div>
              {listing.sellerPhone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <Phone size={15} color="var(--muted-green)" /> <span>{listing.sellerPhone}</span>
                </div>
              )}
              {listing.pickupLocation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <MapPin size={15} color="var(--muted-green)" /> <span>Preferred meetup: {listing.pickupLocation}</span>
                </div>
              )}
            </div>
          </div>

          {!isAuthenticated ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                Please log in to your student account to send an inquiry directly to the seller.
              </p>
              <Link to="/login" className="btn btn-primary btn-pill btn-lg">
                Login to Inquire
              </Link>
            </div>
          ) : success ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'var(--sage-light)',
                  color: 'var(--muted-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem auto',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--charcoal)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                Inquiry Sent Successfully!
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.6 }}>
                The seller has received your message. You can now chat in real-time or receive email replies directly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem 1rem',
                    color: '#991B1B',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--charcoal)' }}>
                  Your Message <span className="req">*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask questions about item condition, edition, or meetup location..."
                  style={{ borderRadius: 'var(--radius-sm)', fontSize: '0.925rem', padding: '0.85rem' }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--charcoal)' }}>
                  Your Contact Info (Email or Phone) <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="e.g. your_email@campus.edu or 9876543210"
                  style={{ height: '46px', borderRadius: 'var(--radius-sm)', fontSize: '0.925rem' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={handleClose} className="btn btn-outline btn-pill">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-pill"
                  disabled={submitting || !message.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send size={15} /> Send Direct Inquiry
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {success && (
          <div
            style={{
              display: 'flex',
              gap: '0.85rem',
              justifyContent: 'flex-end',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
              marginTop: '1.25rem',
            }}
          >
            <button type="button" onClick={handleClose} className="btn btn-outline btn-pill">
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                handleClose();
                navigate(createdInquiryId ? `/messages?inquiryId=${createdInquiryId}` : '/messages');
              }}
              className="btn btn-primary btn-pill"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <MessageSquare size={16} /> Open Direct Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactSellerModal;
