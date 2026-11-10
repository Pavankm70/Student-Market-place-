import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { inquiryService } from '../services/inquiryService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, formatDate } from '../utils/formatters';
import { DEFAULT_PLACEHOLDER_IMAGE, getCategoryPlaceholder, sanitizeImageUrl } from '../utils/constants';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  MessageSquare,
  Send,
  User,
  Users,
  Tag,
  ExternalLink,
  Search,
  CheckCheck,
  Clock,
  Sparkles,
  AlertCircle,
  Inbox,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Filter,
  Check,
  Package,
  Smile,
  ChevronRight
} from 'lucide-react';

const SELLER_QUICK_CHIPS = [
  '👋 Hi! Yes, this item is still available!',
  '📍 Can meet at campus library lobby today',
  '🕒 What time works best for you?',
  '💵 I can do this price for quick campus pickup',
  '✅ Let me know when you arrive on campus!',
];

const BUYER_QUICK_CHIPS = [
  '👋 Hi! Is this still available?',
  '📍 Can we meet at the campus library?',
  '🕒 What time works best for you today?',
  '💵 Would you accept cash or UPI?',
  '📚 What edition or condition is this in?',
];

const MessagesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlInquiryId = searchParams.get('inquiryId');
  const urlListingId = searchParams.get('listingId');

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const activeConvRef = useRef(null);
  activeConvRef.current = activeConv;

  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'BUYING' | 'SELLING'
  const [selectedListingFilter, setSelectedListingFilter] = useState(urlListingId || 'ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sync selectedListingFilter when urlListingId changes
  useEffect(() => {
    if (urlListingId) {
      setSelectedListingFilter(urlListingId);
    }
  }, [urlListingId]);

  // Fetch all conversations
  const fetchConversations = async (keepActive = true) => {
    try {
      const data = await inquiryService.getAllConversations();
      const convList = data || [];
      setConversations(convList);

      if (convList.length > 0) {
        // Priority 1: URL inquiryId match
        if (urlInquiryId) {
          const matched = convList.find((c) => String(c.id) === String(urlInquiryId));
          if (matched) {
            loadActiveThread(matched.id, false);
            return;
          }
        }

        // Priority 2: URL listingId match
        if (urlListingId) {
          const listingMatch = convList.find((c) => String(c.listingId) === String(urlListingId));
          if (listingMatch) {
            loadActiveThread(listingMatch.id, false);
            return;
          }
        }

        // Priority 3: Keep active conversation if it still exists
        if (keepActive && activeConvRef.current) {
          const stillThere = convList.find((c) => c.id === activeConvRef.current.id);
          if (stillThere) {
            return;
          }
        }

        // Default: load the first conversation
        loadActiveThread(convList[0].id, false);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Could not load your messages. Please check network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load a specific conversation thread
  const loadActiveThread = async (inquiryId, updateUrl = true) => {
    setLoadingThread(true);
    try {
      const thread = await inquiryService.getConversation(inquiryId);
      setActiveConv(thread);
      activeConvRef.current = thread;

      if (updateUrl) {
        const nextParams = { inquiryId: String(inquiryId) };
        if (selectedListingFilter !== 'ALL') {
          nextParams.listingId = String(selectedListingFilter);
        }
        setSearchParams(nextParams);
      }
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to load thread:', err);
    } finally {
      setLoadingThread(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchConversations(false);
  }, []);

  // Poll for new messages every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchConversations(true);
        if (activeConvRef.current) {
          loadActiveThread(activeConvRef.current.id, false);
        }
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchConversations(true);
    if (activeConvRef.current) {
      await loadActiveThread(activeConvRef.current.id, false);
    }
    setRefreshing(false);
  };

  // Send a message / reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConv || sending) return;

    const text = replyText.trim();
    setReplyText('');
    setSending(true);

    try {
      const updated = await inquiryService.sendReply(activeConv.id, text);
      setActiveConv(updated);
      activeConvRef.current = updated;

      // Update in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? { ...c, lastMessage: text, lastMessageTime: new Date().toISOString() }
            : c
        )
      );

      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Group listings where current user is the seller (for multi-buyer thread switcher)
  const sellerConversations = conversations.filter((c) => !c.buyer);
  const buyerConversations = conversations.filter((c) => c.buyer);

  // Unique listings where user is seller
  const sellerListingsMap = new Map();
  sellerConversations.forEach((c) => {
    if (!sellerListingsMap.has(c.listingId)) {
      sellerListingsMap.set(c.listingId, {
        id: c.listingId,
        title: c.listingTitle,
        imageUrl: c.listingImageUrl,
        category: c.listingCategory,
        price: c.listingPrice,
        buyerCount: 1,
      });
    } else {
      const existing = sellerListingsMap.get(c.listingId);
      existing.buyerCount += 1;
    }
  });
  const sellerListings = Array.from(sellerListingsMap.values());

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    // Tab filter
    if (filterTab === 'SELLING' && c.buyer) return false;
    if (filterTab === 'BUYING' && !c.buyer) return false;

    // Listing filter
    if (selectedListingFilter !== 'ALL' && String(c.listingId) !== String(selectedListingFilter)) {
      return false;
    }

    // Text search
    if (searchFilter.trim()) {
      const query = searchFilter.toLowerCase();
      const matchesTitle = c.listingTitle?.toLowerCase().includes(query);
      const matchesPerson = c.otherPartyName?.toLowerCase().includes(query);
      const matchesLastMsg = c.lastMessage?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesPerson && !matchesLastMsg) return false;
    }

    return true;
  });

  // Check if current active conversation has multiple buyers on same listing
  const otherBuyersForListing = activeConv && !activeConv.buyer
    ? conversations.filter((c) => c.listingId === activeConv.listingId && !c.buyer)
    : [];

  const currentChips = activeConv && !activeConv.buyer ? SELLER_QUICK_CHIPS : BUYER_QUICK_CHIPS;

  return (
    <div className="page-enter" style={{ padding: '3rem 0 5rem 0', minHeight: '85vh', backgroundColor: 'var(--warm-white)' }}>
      <div className="container" style={{ maxWidth: '1180px' }}>
        {/* Page Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'var(--sage-light)', color: 'var(--charcoal)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
              <MessageSquare size={14} color="var(--muted-green)" /> Campus Chats
            </div>
            <h1 style={{ fontSize: '2.5rem', letterSpacing: '-0.03em', fontWeight: 800, margin: 0, color: 'var(--charcoal)', lineHeight: 1.15 }}>
              Campus Message Hub
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: '0.35rem 0 0 0', lineHeight: 1.5 }}>
              Direct peer communication for campus handovers, questions, and pickup coordination.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="btn btn-outline btn-pill"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              title="Check for new messages"
            >
              <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>
            <Link to="/browse" className="btn btn-primary btn-pill" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Search size={16} />
              <span>Browse Items</span>
            </Link>
          </div>
        </div>

        {/* Global Error Banner */}
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
              marginBottom: '1.5rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Chat Workspace */}
        {loading ? (
          <LoadingSpinner message="Opening campus conversations..." />
        ) : conversations.length === 0 ? (
          /* Empty State */
          <div
            className="card"
            style={{
              padding: '4.5rem 2rem',
              textAlign: 'center',
              maxWidth: '560px',
              margin: '2rem auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: '#ffffff',
            }}
          >
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: 'var(--sage-light)',
                color: 'var(--charcoal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <Inbox size={36} />
            </div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--charcoal)' }}>
              No Conversations Yet
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '420px', marginBottom: '2rem', lineHeight: 1.6 }}>
              When you contact a student seller about an item or when classmates inquire about your active listings, your conversations will organize here.
            </p>
            <Link to="/browse" className="btn btn-primary btn-lg btn-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} /> Explore Marketplace Listings
            </Link>
          </div>
        ) : (
          /* Main Two-Column Chat Container */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(300px, 360px) 1fr',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              boxShadow: 'var(--shadow-xs)',
              minHeight: '680px',
              height: '75vh',
            }}
            className="messages-container-grid"
          >
            {/* Left Sidebar: Filters & Conversations */}
            <div
              style={{
                borderRight: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#ffffff',
                overflow: 'hidden',
              }}
            >
              {/* Tab Switcher: All | Selling | Buying */}
              <div
                style={{
                  display: 'flex',
                  padding: '0.65rem',
                  gap: '0.35rem',
                  backgroundColor: 'var(--warm-white)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setFilterTab('ALL')}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: filterTab === 'ALL' ? 700 : 500,
                    backgroundColor: filterTab === 'ALL' ? 'var(--charcoal)' : 'transparent',
                    color: filterTab === 'ALL' ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  All ({conversations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('SELLING')}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: filterTab === 'SELLING' ? 700 : 500,
                    backgroundColor: filterTab === 'SELLING' ? 'var(--charcoal)' : 'transparent',
                    color: filterTab === 'SELLING' ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Buyers ({sellerConversations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('BUYING')}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: filterTab === 'BUYING' ? 700 : 500,
                    backgroundColor: filterTab === 'BUYING' ? 'var(--charcoal)' : 'transparent',
                    color: filterTab === 'BUYING' ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Inquiries ({buyerConversations.length})
                </button>
              </div>

              {/* Seller Listing Filter Selector */}
              {sellerListings.length > 0 && filterTab !== 'BUYING' && (
                <div
                  style={{
                    padding: '0.6rem 0.85rem',
                    backgroundColor: 'var(--warm-white)',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Package size={14} color="var(--charcoal)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--charcoal)', whiteSpace: 'nowrap' }}>
                    Item:
                  </span>
                  <select
                    value={selectedListingFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedListingFilter(val);
                      const nextParams = {};
                      if (val !== 'ALL') nextParams.listingId = val;
                      if (activeConv) nextParams.inquiryId = String(activeConv.id);
                      setSearchParams(nextParams);
                    }}
                    style={{
                      flex: 1,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--charcoal)',
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.35rem 0.6rem',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="ALL">All Items ({conversations.length} chats)</option>
                    {sellerListings.map((l) => (
                      <option key={l.id} value={String(l.id)}>
                        {l.title} ({l.buyerCount} {l.buyerCount === 1 ? 'buyer' : 'buyers'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Search Bar in Sidebar */}
              <div style={{ padding: '0.75rem 0.85rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={15}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search by buyer name or title..."
                    className="form-input"
                    style={{
                      paddingLeft: '34px',
                      paddingTop: '0.45rem',
                      paddingBottom: '0.45rem',
                      fontSize: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--warm-white)',
                    }}
                  />
                </div>
              </div>

              {/* Conversations Scrollable List */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredConversations.length === 0 ? (
                  <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No conversations match your filter.
                  </div>
                ) : (
                  filteredConversations.map((c) => {
                    const isSelected = activeConv?.id === c.id;
                    const isSellerView = !c.buyer;

                    return (
                      <div
                        key={c.id}
                        onClick={() => loadActiveThread(c.id)}
                        style={{
                          padding: '1rem',
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--sage-light)' : 'transparent',
                          borderLeft: isSelected ? '4px solid var(--charcoal)' : '4px solid transparent',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          gap: '0.85rem',
                          alignItems: 'flex-start',
                        }}
                      >
                        {/* Avatar / Thumbnail */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <img
                            src={sanitizeImageUrl(c.listingImageUrl) || getCategoryPlaceholder(c.listingCategory)}
                            alt={c.listingTitle}
                            referrerPolicy="no-referrer"
                            style={{
                              width: '48px',
                              height: '48px',
                              objectFit: 'cover',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)',
                            }}
                            onError={(e) => {
                              e.target.src = getCategoryPlaceholder(c.listingCategory);
                            }}
                          />
                          {isSellerView && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '-3px',
                                right: '-3px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--charcoal)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                border: '2px solid #ffffff',
                              }}
                              title="Buyer Inquiry"
                            >
                              <User size={10} />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Row 1: Primary Header & Timestamp */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'baseline',
                              marginBottom: '0.25rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                              <span
                                style={{
                                  fontSize: '0.9rem',
                                  fontWeight: 700,
                                  color: isSelected ? 'var(--charcoal)' : 'var(--charcoal)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {isSellerView ? `👤 ${c.otherPartyName}` : c.listingTitle}
                              </span>
                            </div>

                            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                              {formatDate(c.lastMessageTime || c.createdAt)}
                            </span>
                          </div>

                          {/* Row 2: Listing Context Badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '1px 7px',
                                borderRadius: 'var(--radius-pill)',
                                backgroundColor: isSellerView ? 'var(--sage-light)' : 'rgba(229, 161, 91, 0.1)',
                                color: 'var(--charcoal)',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              {isSellerView ? 'Buyer Inquiry' : `Seller: ${c.otherPartyName}`}
                            </span>

                            {isSellerView && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--text-muted)',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '140px',
                                }}
                              >
                                {c.listingTitle}
                              </span>
                            )}
                          </div>

                          {/* Row 3: Snippet */}
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {c.lastMessage || 'Initial item question'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Pane: Active Thread */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--warm-white)',
                overflow: 'hidden',
              }}
            >
              {activeConv ? (
                <>
                  {/* Thread Header */}
                  <div
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--sage-light)',
                          color: 'var(--charcoal)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.2rem',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {activeConv.otherPartyName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--charcoal)' }}>
                            {activeConv.buyer ? `Seller: ${activeConv.otherPartyName}` : `Buyer: ${activeConv.otherPartyName}`}
                          </span>
                          <span
                            style={{
                              fontSize: '0.725rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              backgroundColor: 'var(--sage-light)',
                              color: 'var(--charcoal)',
                            }}
                          >
                            {activeConv.otherPartyRole}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {activeConv.buyer ? activeConv.receiverEmail : activeConv.senderEmail}
                          {activeConv.contactInfo && (
                            <span style={{ marginLeft: '0.5rem', color: 'var(--charcoal)' }}>
                              • Contact: <strong>{activeConv.contactInfo}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Listing Preview Pill on Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        backgroundColor: 'var(--warm-white)',
                        padding: '0.45rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <img
                        src={sanitizeImageUrl(activeConv.listingImageUrl) || getCategoryPlaceholder(activeConv.listingCategory)}
                        alt={activeConv.listingTitle}
                        referrerPolicy="no-referrer"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          e.target.src = getCategoryPlaceholder(activeConv.listingCategory);
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--charcoal)',
                            maxWidth: '180px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {activeConv.listingTitle}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--charcoal)', fontWeight: 800 }}>
                          {formatPrice(activeConv.listingPrice)}
                        </div>
                      </div>
                      <Link
                        to={`/listings/${activeConv.listingId}`}
                        style={{
                          color: 'var(--charcoal)',
                          display: 'flex',
                          alignItems: 'center',
                          marginLeft: '0.25rem',
                          padding: '4px',
                          borderRadius: '6px',
                        }}
                        title="View Full Listing"
                      >
                        <ExternalLink size={16} />
                      </Link>
                    </div>
                  </div>

                  {/* MULTI-BUYER SWITCHER BANNER */}
                  {!activeConv.buyer && otherBuyersForListing.length > 1 && (
                    <div
                      style={{
                        padding: '0.65rem 1.25rem',
                        backgroundColor: 'var(--sage-light)',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', fontWeight: 700, color: 'var(--charcoal)' }}>
                        <Users size={16} />
                        <span>{otherBuyersForListing.length} Buyers Inquiring:</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {otherBuyersForListing.map((ob) => {
                          const isCurrent = ob.id === activeConv.id;
                          return (
                            <button
                              key={ob.id}
                              type="button"
                              onClick={() => loadActiveThread(ob.id)}
                              style={{
                                fontSize: '0.785rem',
                                fontWeight: isCurrent ? 700 : 500,
                                padding: '0.3rem 0.85rem',
                                borderRadius: 'var(--radius-pill)',
                                border: isCurrent ? '1.5px solid var(--charcoal)' : '1px solid var(--border-subtle)',
                                backgroundColor: isCurrent ? 'var(--charcoal)' : '#ffffff',
                                color: isCurrent ? '#ffffff' : 'var(--charcoal)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <User size={13} />
                              <span>{ob.otherPartyName}</span>
                              <span
                                style={{
                                  fontSize: '0.675rem',
                                  padding: '1px 6px',
                                  borderRadius: 'var(--radius-pill)',
                                  backgroundColor: isCurrent ? 'rgba(255,255,255,0.25)' : 'var(--sage-light)',
                                  color: isCurrent ? '#ffffff' : 'var(--charcoal)',
                                }}
                              >
                                {(ob.replies?.length || 0) + 1} msgs
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Message Stream Area */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '1.5rem',
                      backgroundColor: 'var(--warm-white)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                    }}
                  >
                    {/* Safe Meetup Banner in Chat */}
                    <div
                      style={{
                        padding: '0.75rem 1.25rem',
                        backgroundColor: 'var(--sage-light)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.825rem',
                        color: 'var(--charcoal)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        margin: '0 auto',
                        maxWidth: '85%',
                      }}
                    >
                      <ShieldCheck size={18} color="var(--muted-green)" style={{ flexShrink: 0 }} />
                      <span>
                        <strong>Safe Campus Meetup:</strong> Use the Student Center or Library entrance. For maximum protection, confirm payments via Campus Escrow!
                      </span>
                    </div>

                    {/* Initial Inquiry Message Bubble */}
                    <div
                      style={{
                        alignSelf: activeConv.buyer ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginBottom: '0.3rem',
                          textAlign: activeConv.buyer ? 'right' : 'left',
                          fontWeight: 500,
                        }}
                      >
                        {activeConv.senderName} (Initial Inquiry) • {formatDate(activeConv.createdAt)}
                      </div>
                      <div
                        style={{
                          padding: '0.95rem 1.25rem',
                          borderRadius: activeConv.buyer ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          backgroundColor: activeConv.buyer ? 'var(--charcoal)' : '#ffffff',
                          color: activeConv.buyer ? '#ffffff' : 'var(--charcoal)',
                          boxShadow: 'var(--shadow-xs)',
                          border: activeConv.buyer ? 'none' : '1px solid var(--border-subtle)',
                          fontSize: '0.95rem',
                          lineHeight: 1.55,
                        }}
                      >
                        {activeConv.message}
                        {activeConv.contactInfo && (
                          <div
                            style={{
                              marginTop: '0.6rem',
                              paddingTop: '0.5rem',
                              borderTop: activeConv.buyer ? '1px solid rgba(255,255,255,0.25)' : '1px solid var(--border-subtle)',
                              fontSize: '0.8rem',
                              opacity: 0.95,
                            }}
                          >
                            Contact Shared: <strong>{activeConv.contactInfo}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Replies Stream */}
                    {activeConv.replies &&
                      activeConv.replies.map((reply) => {
                        const isMe = reply.fromMe;
                        return (
                          <div
                            key={reply.id}
                            style={{
                              alignSelf: isMe ? 'flex-end' : 'flex-start',
                              maxWidth: '75%',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                marginBottom: '0.3rem',
                                textAlign: isMe ? 'right' : 'left',
                                fontWeight: 500,
                              }}
                            >
                              {reply.senderName} • {formatDate(reply.createdAt)}
                            </div>
                            <div
                              style={{
                                padding: '0.95rem 1.25rem',
                                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                backgroundColor: isMe ? 'var(--charcoal)' : '#ffffff',
                                color: isMe ? '#ffffff' : 'var(--charcoal)',
                                boxShadow: 'var(--shadow-xs)',
                                border: isMe ? 'none' : '1px solid var(--border-subtle)',
                                fontSize: '0.95rem',
                                lineHeight: 1.55,
                              }}
                            >
                              {reply.message}
                            </div>
                          </div>
                        );
                      })}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Chips suggestions */}
                  <div
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderTop: '1px solid var(--border-subtle)',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      gap: '0.5rem',
                      overflowX: 'auto',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {currentChips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReplyText(chip)}
                        style={{
                          fontSize: '0.785rem',
                          padding: '0.4rem 0.85rem',
                          borderRadius: 'var(--radius-pill)',
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: 'var(--sage-light)',
                          color: 'var(--charcoal)',
                          cursor: 'pointer',
                          flexShrink: 0,
                          fontWeight: 500,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Message Input Form */}
                  <form
                    onSubmit={handleSendReply}
                    style={{
                      padding: '1rem 1.5rem',
                      borderTop: '1px solid var(--border-subtle)',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'center',
                    }}
                  >
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Type a message to ${activeConv.otherPartyName}...`}
                      className="form-input"
                      style={{
                        flex: 1,
                        fontSize: '0.95rem',
                        padding: '0.75rem 1.25rem',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: 'var(--warm-white)',
                      }}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      className="btn btn-primary btn-pill"
                      style={{
                        padding: '0.75rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 700,
                      }}
                    >
                      {sending ? 'Sending...' : (
                        <>
                          <span>Send</span>
                          <Send size={16} />
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                /* No Conversation Selected Placeholder */
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--text-muted)',
                    padding: '2rem',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--sage-light)',
                      color: 'var(--charcoal)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <MessageSquare size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--charcoal)', margin: 0 }}>
                    Select a conversation
                  </h3>
                  <p style={{ fontSize: '0.9rem', maxWidth: '360px', marginTop: '0.5rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Pick an item thread on the left to coordinate handover spots, verify pricing, and chat securely with peers.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
