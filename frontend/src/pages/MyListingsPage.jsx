import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listingService } from '../services/listingService';
import { formatPrice, formatDate } from '../utils/formatters';
import { getCategoryPlaceholder, sanitizeImageUrl } from '../utils/constants';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import {
  Package,
  PlusCircle,
  Edit,
  Trash2,
  Archive,
  CheckCircle,
  ExternalLink,
  Calendar,
  Tag,
  AlertTriangle,
  MessageSquare,
  ShieldAlert,
  Loader2,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MyListingsPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('ALL'); // ALL, AVAILABLE, SOLD
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchMyListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listingService.getMyListings();
      setListings(data || []);
    } catch (err) {
      console.error('Failed to load my listings:', err);
      setError('Unable to fetch your listings. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  // Mark as Sold with immediate state update
  const handleMarkAsSold = async (id) => {
    setActionLoadingId(id);
    try {
      await listingService.markAsSold(id);
      setListings((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'SOLD' } : item))
      );
      toast.success('Listing marked as sold!');
    } catch (err) {
      console.error('Failed to mark listing as sold:', err);
      const friendlyMsg = err.response?.data?.message || 'Could not update status. Please try again.';
      toast.error(friendlyMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Safe Delete / Archive with immediate state update & clean modal
  const handleConfirmDelete = async () => {
    if (!deleteTarget || actionLoadingId !== null) return;

    setActionLoadingId(deleteTarget.id);
    try {
      const res = await listingService.deleteListing(deleteTarget.id);
      // Remove from active list
      setListings((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      
      const isArchived = res?.action === 'archived' || deleteTarget.hasOrderHistory || deleteTarget.status === 'SOLD';
      if (isArchived) {
        toast.success(res?.message || `"${deleteTarget.title}" was safely archived and hidden from the marketplace.`);
      } else {
        toast.success(res?.message || `"${deleteTarget.title}" was permanently deleted.`);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete/archive listing:', err);
      let friendlyError = 'Unable to delete listing. Please try again.';
      if (err.response?.status === 403) {
        friendlyError = 'You are only authorized to manage your own listings.';
      } else if (err.response?.data?.message) {
        friendlyError = err.response.data.message;
      }
      toast.error(friendlyError);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredListings = listings.filter((item) => {
    if (filterTab === 'AVAILABLE') return item.status === 'AVAILABLE';
    if (filterTab === 'SOLD') return item.status === 'SOLD';
    return true;
  });

  const availableCount = listings.filter((l) => l.status === 'AVAILABLE').length;
  const soldCount = listings.filter((l) => l.status === 'SOLD').length;

  return (
    <div className="page-enter my-listings-page">
      <div className="container" style={{ maxWidth: '1120px' }}>
        {/* Page Header */}
        <div className="my-listings-header">
          <div>
            <div className="seller-meta-row">
              <span className="seller-tag seller-id-tag">
                Seller #{user?.sellerId || user?.id || '—'}
              </span>
              <span className="seller-tag user-id-tag">
                User ID #{user?.id || '—'}
              </span>
              <span className="seller-tag verified-badge">
                <CheckCircle size={12} /> Verified Student Seller
              </span>
            </div>
            <h1 className="my-listings-title">
              My Listings Hub
            </h1>
            <p className="my-listings-subtitle">
              Manage your active university listings, mark items sold, and answer student buyer chats.
            </p>
          </div>
          <Link to="/sell" className="btn btn-primary btn-pill post-listing-btn">
            <PlusCircle size={18} />
            <span>Post New Listing</span>
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="listings-tabs-bar">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`tab-btn ${filterTab === 'ALL' ? 'active' : ''}`}
          >
            All Active Items ({listings.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('AVAILABLE')}
            className={`tab-btn ${filterTab === 'AVAILABLE' ? 'active' : ''}`}
          >
            Available Now ({availableCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('SOLD')}
            className={`tab-btn ${filterTab === 'SOLD' ? 'active' : ''}`}
          >
            Sold Out ({soldCount})
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <LoadingSpinner message="Fetching your listings..." />
        ) : error ? (
          <EmptyState
            title="Failed to Load Listings"
            message={error}
            actionText="Try Again"
            onAction={fetchMyListings}
          />
        ) : listings.length === 0 ? (
          <EmptyState
            icon={Package}
            title="You don't have any active listings yet"
            message="Ready to sell textbooks, electronics, calculators, or dorm gear? Create your first listing and start connecting with classmates!"
            actionText="Create Listing"
            actionLink="/sell"
          />
        ) : filteredListings.length === 0 ? (
          <EmptyState
            title={`No ${filterTab.toLowerCase()} listings found`}
            message="No items match this status filter."
            actionText="Show All Items"
            onAction={() => setFilterTab('ALL')}
          />
        ) : (
          <div className="my-listings-grid stagger-grid">
            {filteredListings.map((item) => {
              const isSold = item.status === 'SOLD';
              const isReserved = item.status === 'RESERVED';
              const isActionLoading = actionLoadingId === item.id;
              const hasOrders = item.hasOrderHistory || (item.orderCount && item.orderCount > 0);

              return (
                <div
                  key={item.id}
                  className={`my-listing-card ${isSold ? 'listing-sold' : ''}`}
                >
                  {/* Thumbnail */}
                  <div className="listing-thumb-wrap">
                    <img
                      src={sanitizeImageUrl(item.imageUrl) || getCategoryPlaceholder(item.category)}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="listing-thumb-img"
                      onError={(e) => {
                        const placeholder = getCategoryPlaceholder(item.category);
                        if (e.target.src !== placeholder) {
                          e.target.src = placeholder;
                        }
                      }}
                    />
                    {isSold && <span className="listing-thumb-badge badge-sold">SOLD</span>}
                    {isReserved && !isSold && <span className="listing-thumb-badge badge-reserved">RESERVED</span>}
                  </div>

                  {/* Details */}
                  <div className="listing-details">
                    <div className="listing-badge-row">
                      <span className="badge badge-category">
                        <Tag size={12} /> {item.categoryDisplayName || item.category}
                      </span>
                      {isSold ? (
                        <span className="badge badge-sold">SOLD OUT</span>
                      ) : isReserved ? (
                        <span className="badge badge-reserved">IN CHECKOUT</span>
                      ) : (
                        <span className="badge badge-available">AVAILABLE</span>
                      )}
                      <span className="chat-counter-pill">
                        <MessageSquare size={13} color="var(--success, #3E7B54)" />
                        {item.inquiryCount > 0
                          ? `${item.inquiryCount} Buyer ${item.inquiryCount === 1 ? 'Chat' : 'Chats'}`
                          : '0 Buyer Chats'}
                      </span>
                      <span className="listing-date">
                        <Calendar size={13} /> {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <h3 className="listing-item-title">
                      <Link to={`/listings/${item.id}`} className="listing-title-anchor">
                        {item.title}
                      </Link>
                    </h3>

                    <div className="listing-price-row">
                      <span className="listing-price-amount">{formatPrice(item.price)}</span>
                      {hasOrders && (
                        <span className="order-history-indicator" title="This listing has associated purchase orders">
                          <Clock size={12} /> Order History
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="listing-actions-bar">
                    <Link
                      to={`/messages?listingId=${item.id}`}
                      className="btn btn-sm btn-outline btn-pill action-chat-btn"
                      title="View and answer buyer inquiries for this item"
                    >
                      <MessageSquare size={14} />
                      <span>{item.inquiryCount > 0 ? `Chats (${item.inquiryCount})` : 'Chats'}</span>
                    </Link>

                    <Link
                      to={`/listings/${item.id}`}
                      className="btn btn-sm btn-outline btn-pill action-view-btn"
                      title="View Public Marketplace Page"
                    >
                      <ExternalLink size={14} />
                      <span>View</span>
                    </Link>

                    {!isSold ? (
                      <button
                        type="button"
                        onClick={() => handleMarkAsSold(item.id)}
                        disabled={isActionLoading}
                        className="btn btn-sm btn-success btn-pill action-sold-btn"
                        title="Mark item as SOLD"
                      >
                        <CheckCircle size={14} />
                        <span>Mark Sold</span>
                      </button>
                    ) : (
                      <span className="completed-badge">
                        Completed
                      </span>
                    )}

                    <Link
                      to={`/listings/${item.id}/edit`}
                      className="btn btn-sm btn-outline btn-pill action-edit-btn"
                      title="Edit Listing Information"
                    >
                      <Edit size={14} />
                      <span>Edit</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      disabled={isActionLoading}
                      className="btn btn-sm btn-outline btn-pill action-delete-btn"
                      title={hasOrders || isSold ? 'Archive this listing' : 'Delete listing'}
                    >
                      {hasOrders || isSold ? <Archive size={14} /> : <Trash2 size={14} />}
                      <span>{hasOrders || isSold ? 'Archive' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODERN DELETE / ARCHIVE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => !actionLoadingId && setDeleteTarget(null)}>
          <div className="modal-content delete-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="delete-modal-header">
              <div className="modal-title-wrap">
                <div className={`modal-icon-badge ${deleteTarget.hasOrderHistory || deleteTarget.status === 'SOLD' ? 'archive-mode' : 'delete-mode'}`}>
                  {deleteTarget.hasOrderHistory || deleteTarget.status === 'SOLD' ? (
                    <Archive size={20} />
                  ) : (
                    <Trash2 size={20} />
                  )}
                </div>
                <div>
                  <h3 className="delete-modal-title">
                    {deleteTarget.hasOrderHistory || deleteTarget.status === 'SOLD'
                      ? 'Archive Listing'
                      : 'Delete Listing'}
                  </h3>
                  <span className="delete-modal-subtitle">
                    {deleteTarget.hasOrderHistory || deleteTarget.status === 'SOLD'
                      ? 'Deactivate listing and preserve historical orders'
                      : 'Permanently remove listing from marketplace'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-icon"
                onClick={() => !actionLoadingId && setDeleteTarget(null)}
                disabled={actionLoadingId !== null}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Product Preview */}
            <div className="delete-modal-body">
              <div className="modal-product-preview">
                <img
                  src={sanitizeImageUrl(deleteTarget.imageUrl) || getCategoryPlaceholder(deleteTarget.category)}
                  alt={deleteTarget.title}
                  referrerPolicy="no-referrer"
                  className="modal-product-img"
                  onError={(e) => {
                    const placeholder = getCategoryPlaceholder(deleteTarget.category);
                    if (e.target.src !== placeholder) {
                      e.target.src = placeholder;
                    }
                  }}
                />
                <div className="modal-product-info">
                  <span className="badge badge-category" style={{ alignSelf: 'flex-start', marginBottom: '4px' }}>
                    {deleteTarget.categoryDisplayName || deleteTarget.category}
                  </span>
                  <div className="modal-product-name">{deleteTarget.title}</div>
                  <div className="modal-product-price">{formatPrice(deleteTarget.price)}</div>
                </div>
              </div>

              {/* Explanatory Notice */}
              <div className={`modal-notice-box ${deleteTarget.hasOrderHistory || deleteTarget.status === 'SOLD' ? 'archive-notice' : 'delete-notice'}`}>
                {deleteTarget.hasOrderHistory || deleteTarget.status === 'SOLD' ? (
                  <>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      <strong>Safe Archival:</strong> This listing is associated with historical student transactions or orders.
                    </p>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                      To protect order receipts and buyer escrow history, it will be <strong>safely archived</strong>. It will immediately disappear from the public marketplace and your active listings, while preserving past transaction records.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      <strong>Permanent Deletion:</strong> This listing has no order history.
                    </p>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                      It will be permanently removed from CampusLoop. This action cannot be reversed.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="delete-modal-footer">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="btn btn-outline btn-pill"
                disabled={actionLoadingId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className={`btn btn-pill ${deleteTarget.hasOrderHistory || deleteTarget.status === 'SOLD' ? 'btn-primary' : 'btn-danger'}`}
                disabled={actionLoadingId !== null}
              >
                {actionLoadingId !== null ? (
                  <>
                    <Loader2 size={16} className="spin-icon" />
                    <span>Processing...</span>
                  </>
                ) : deleteTarget.hasOrderHistory || deleteTarget.status === 'SOLD' ? (
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

      {/* STYLES */}
      <style>{`
        .my-listings-page {
          padding: 3rem 0 5rem 0;
          min-height: 85vh;
          background-color: var(--warm-white, #FAFAF6);
        }

        .my-listings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-bottom: 2.25rem;
        }

        .seller-meta-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.65rem;
          flex-wrap: wrap;
        }

        .seller-tag {
          font-size: 0.76rem;
          font-weight: 700;
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .seller-id-tag {
          background-color: var(--charcoal, #20231F);
          color: #FFFFFF;
        }

        .user-id-tag {
          background-color: var(--sage-light, #EDF2EB);
          color: var(--charcoal, #20231F);
          border: 1px solid var(--border-color, #DDE3DA);
        }

        .verified-badge {
          background-color: var(--success-light, #EDF6F0);
          color: var(--success-text, #235436);
          border: 1px solid var(--success-border, #C8E5D2);
        }

        .my-listings-title {
          font-size: 2.25rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--charcoal, #20231F);
          margin-bottom: 0.35rem;
          line-height: 1.2;
        }

        .my-listings-subtitle {
          color: var(--text-muted, #747B72);
          font-size: 1rem;
          margin: 0;
          line-height: 1.5;
        }

        .post-listing-btn {
          font-weight: 700;
          padding: 0.65rem 1.35rem;
        }

        /* Tabs */
        .listings-tabs-bar {
          display: flex;
          gap: 0.65rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--border-color, #DDE3DA);
          padding-bottom: 0.85rem;
          overflow-x: auto;
        }

        .tab-btn {
          background: transparent;
          border: 1px solid transparent;
          padding: 0.45rem 1.05rem;
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-muted, #747B72);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .tab-btn:hover {
          color: var(--charcoal, #20231F);
          background-color: var(--sage-light, #EDF2EB);
        }

        .tab-btn.active {
          background-color: var(--charcoal, #20231F);
          color: #FFFFFF;
          font-weight: 700;
        }

        /* Listing Cards */
        .my-listings-grid {
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
        }

        .my-listing-card {
          background: #FFFFFF;
          border-radius: var(--radius-lg, 20px);
          border: 1px solid var(--border-color, #DDE3DA);
          padding: 1.35rem 1.5rem;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1.5rem;
          box-shadow: var(--shadow-xs);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }

        .my-listing-card:hover {
          border-color: var(--sage-muted, #788B76);
          box-shadow: var(--shadow-sm);
          transform: translateY(-2px);
        }

        .my-listing-card.listing-sold {
          opacity: 0.85;
          background-color: #FAFAF7;
        }

        .listing-thumb-wrap {
          position: relative;
          width: 96px;
          height: 96px;
          flex-shrink: 0;
          border-radius: var(--radius-sm, 12px);
          overflow: hidden;
          background-color: var(--sage-light, #EDF2EB);
          border: 1px solid var(--border-color, #DDE3DA);
        }

        .listing-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .my-listing-card:hover .listing-thumb-img {
          transform: scale(1.05);
        }

        .listing-thumb-badge {
          position: absolute;
          bottom: 4px;
          left: 4px;
          right: 4px;
          text-align: center;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 4px;
          border-radius: 4px;
          letter-spacing: 0.04em;
        }

        .listing-details {
          flex-grow: 1;
          min-width: 260px;
        }

        .listing-badge-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.45rem;
          flex-wrap: wrap;
        }

        .chat-counter-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.775rem;
          font-weight: 700;
          padding: 0.2rem 0.65rem;
          border-radius: var(--radius-full);
          background-color: var(--sage-light, #EDF2EB);
          color: var(--charcoal, #20231F);
          border: 1px solid var(--border-color, #DDE3DA);
        }

        .listing-date {
          font-size: 0.785rem;
          color: var(--text-muted, #747B72);
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-left: auto;
        }

        .listing-item-title {
          font-size: 1.2rem;
          font-weight: 800;
          margin-bottom: 0.35rem;
          color: var(--charcoal, #20231F);
        }

        .listing-title-anchor {
          color: inherit;
          text-decoration: none;
          transition: color 0.18s ease;
        }

        .listing-title-anchor:hover {
          color: var(--success, #3E7B54);
        }

        .listing-price-row {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .listing-price-amount {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--charcoal, #20231F);
        }

        .order-history-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--info-text, #2C4A5B);
          background-color: var(--info-light, #EEF4F8);
          border: 1px solid var(--info-border, #C8DBE5);
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

        /* Action Buttons */
        .listing-actions-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .action-delete-btn:hover {
          background-color: var(--danger-light, #FDF1F0) !important;
          border-color: var(--danger-border, #F5CAC6) !important;
          color: var(--danger, #C24A3F) !important;
        }

        .completed-badge {
          font-size: 0.825rem;
          font-weight: 700;
          color: var(--text-muted, #747B72);
          padding: 0.38rem 0.85rem;
          background-color: var(--sage-light, #EDF2EB);
          border-radius: var(--radius-full);
        }

        /* Modal Details */
        .delete-modal-card {
          padding: 1.75rem;
        }

        .delete-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
        }

        .modal-title-wrap {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .modal-icon-badge {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-icon-badge.archive-mode {
          background-color: var(--sage-primary, #DCE7DC);
          color: var(--charcoal, #20231F);
        }

        .modal-icon-badge.delete-mode {
          background-color: var(--danger-light, #FDF1F0);
          color: var(--danger, #C24A3F);
        }

        .delete-modal-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--charcoal, #20231F);
          margin: 0 0 2px 0;
        }

        .delete-modal-subtitle {
          font-size: 0.825rem;
          color: var(--text-muted, #747B72);
        }

        .modal-close-icon {
          background: transparent;
          border: none;
          color: var(--text-muted, #747B72);
          cursor: pointer;
          padding: 4px;
          border-radius: 8px;
          transition: background-color 0.15s ease;
        }

        .modal-close-icon:hover {
          background-color: var(--sage-light, #EDF2EB);
          color: var(--charcoal, #20231F);
        }

        .delete-modal-body {
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
          margin-bottom: 1.5rem;
        }

        .modal-product-preview {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem;
          background: var(--warm-white, #FAFAF6);
          border-radius: 14px;
          border: 1px solid var(--border-color, #DDE3DA);
        }

        .modal-product-img {
          width: 64px;
          height: 64px;
          object-fit: cover;
          border-radius: 10px;
          border: 1px solid var(--border-color, #DDE3DA);
          flex-shrink: 0;
        }

        .modal-product-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .modal-product-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--charcoal, #20231F);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .modal-product-price {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--charcoal, #20231F);
        }

        .modal-notice-box {
          padding: 1rem 1.15rem;
          border-radius: 14px;
          font-size: 0.885rem;
          line-height: 1.45;
        }

        .modal-notice-box.archive-notice {
          background-color: var(--sage-light, #EDF2EB);
          border: 1px solid var(--border-color, #DDE3DA);
          color: var(--charcoal, #20231F);
        }

        .modal-notice-box.delete-notice {
          background-color: var(--danger-light, #FDF1F0);
          border: 1px solid var(--danger-border, #F5CAC6);
          color: var(--danger-text, #8E2B23);
        }

        .delete-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        .spin-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MyListingsPage;
