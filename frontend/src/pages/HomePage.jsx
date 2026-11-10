import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listingService } from '../services/listingService';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import { useScrollReveal } from '../utils/useScrollReveal';
import {
  ArrowRight,
  BookOpen,
  Laptop,
  FlaskConical,
  Armchair,
  PenTool,
  Shirt,
  MoreHorizontal,
  UserCheck,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Lock,
  Compass,
  Star,
  Zap,
  MapPin,
  HeartHandshake,
} from 'lucide-react';

const categories = [
  { name: 'Books', key: 'BOOKS', icon: BookOpen, count: 'Textbooks & Guides' },
  { name: 'Electronics', key: 'ELECTRONICS', icon: Laptop, count: 'Calculators & Tech' },
  { name: 'Lab Supplies', key: 'LAB_SUPPLIES', icon: FlaskConical, count: 'Coats & Science Gear' },
  { name: 'Furniture', key: 'FURNITURE', icon: Armchair, count: 'Dorm Desks & Chairs' },
  { name: 'Stationery', key: 'STATIONERY', icon: PenTool, count: 'Notebooks & Kits' },
  { name: 'Clothing', key: 'CLOTHING', icon: Shirt, count: 'Varsity & Merch' },
  { name: 'Other', key: 'OTHER', icon: MoreHorizontal, count: 'Campus Essentials' },
];

const HERO_PHRASES = [
  "Discover Campus Deals",
  "Buy and Sell on Campus",
  "Find What You Need",
  "Connect With Your Campus"
];

const HomePage = () => {
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Scroll reveal references
  const [catRef, catVisible] = useScrollReveal();
  const [featRef, featVisible] = useScrollReveal();
  const [stepsRef, stepsVisible] = useScrollReveal();
  const [trustRef, trustVisible] = useScrollReveal();

  // Animated rotating typewriter headline
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = HERO_PHRASES[phraseIndex];
    const typingSpeed = isDeleting ? 30 : 70;

    if (!isDeleting && displayText === currentPhrase) {
      const pauseTimeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2200);
      return () => clearTimeout(pauseTimeout);
    }

    if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % HERO_PHRASES.length);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayText(
        isDeleting
          ? currentPhrase.substring(0, displayText.length - 1)
          : currentPhrase.substring(0, displayText.length + 1)
      );
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await listingService.getFeaturedListings();
        setFeaturedListings(data || []);
      } catch (err) {
        console.error('Failed to load featured listings:', err);
        setError('Unable to load latest listings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  const handleHeroSearch = (query) => {
    if (query) {
      navigate(`/browse?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/browse');
    }
  };

  return (
    <div className="homepage-root page-transition">
      {/* HERO SECTION WITH FLOATING GRADIENTS & ANIMATED TYPOGRAPHY */}
      <section className="hero-section">
        {/* Subtle Animated Background Blobs */}
        <div className="hero-ambient-blob hero-blob-1" />
        <div className="hero-ambient-blob hero-blob-2" />

        <div className="container hero-container">
          {/* Subtle Sage Badge */}
          <div className="hero-badge-pill">
            <Sparkles size={14} color="#747B72" />
            <span>The Student Campus Marketplace</span>
            <span className="hero-badge-highlight">VERIFIED</span>
          </div>

          {/* Large Editorial Headline */}
          <h1 className="hero-main-heading">
            Your Campus.<br />
            Your Community.<br />
            Your Marketplace.
          </h1>

          {/* Animated Hero Rotating Words with Typing Effect & Cursor */}
          <div className="hero-typewriter-row">
            <span className="typewriter-text">{displayText}</span>
            <span className="typewriter-blinking-cursor" />
          </div>

          {/* Supporting Description */}
          <p className="hero-description">
            Safely buy and sell textbooks, graphing calculators, laptops, and dorm essentials with verified classmates. Zero shipping fees, zero strangers, seamless in-person campus meetups.
          </p>

          {/* Minimalist Floating Search Bar */}
          <div className="hero-search-wrapper">
            <SearchBar onSearch={handleHeroSearch} placeholder="Search textbooks, TI-84, lab coats, dorm desk..." />
          </div>

          {/* Hero CTA Buttons */}
          <div className="hero-cta-group">
            <Link to="/browse" className="btn btn-primary btn-lg btn-pill hero-primary-btn">
              <span>Explore Marketplace</span>
              <ArrowRight size={17} />
            </Link>
            <Link to="/sell" className="btn btn-outline btn-lg btn-pill hero-secondary-btn">
              <PlusCircle size={17} />
              <span>List an Item</span>
            </Link>
          </div>

          {/* Social Proof Metric Pillars */}
          <div className="hero-metrics-bar">
            <div className="metric-item">
              <div className="metric-value">100%</div>
              <div className="metric-label">Verified Students</div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="metric-value">₹0</div>
              <div className="metric-label">Platform Fees</div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="metric-value">Campus Escrow</div>
              <div className="metric-label">Handover Protected</div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section ref={catRef} className={`home-section categories-section scroll-reveal ${catVisible ? 'reveal-visible' : ''}`}>
        <div className="container">
          <div className="section-header-centered">
            <span className="section-pill-tag">Marketplace Categories</span>
            <h2 className="section-heading">Essential Gear for University Life</h2>
            <p className="section-subheading">
              Find syllabus books, engineering tools, lab coats, and room furniture from peers on campus.
            </p>
          </div>

          <div className="categories-grid stagger-grid">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.key}
                  to={`/browse?category=${cat.key}`}
                  className="category-card"
                >
                  <div className="cat-icon-wrapper">
                    <Icon size={24} />
                  </div>
                  <h3 className="cat-name">{cat.name}</h3>
                  <span className="cat-description">{cat.count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED LATEST LISTINGS SECTION */}
      <section ref={featRef} className={`home-section featured-section scroll-reveal ${featVisible ? 'reveal-visible' : ''}`}>
        <div className="container">
          <div className="featured-header-row">
            <div>
              <div className="section-pill-tag" style={{ marginBottom: '0.4rem' }}>
                FRESH ON CAMPUS
              </div>
              <h2 className="section-heading" style={{ margin: 0 }}>
                Featured Campus Listings
              </h2>
            </div>
            <Link to="/browse" className="btn btn-outline btn-pill view-all-btn">
              <span>View All Items</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="grid-listings stagger-grid">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="skeleton-card">
                  <div className="skeleton skeleton-img" />
                  <div style={{ padding: '1.25rem' }}>
                    <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '85%', height: '22px' }} />
                    <div className="skeleton skeleton-text" style={{ width: '50%', height: '24px', marginTop: '12px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <EmptyState title="Unable to Load" message={error} actionText="Try Again" onAction={() => window.location.reload()} />
          ) : featuredListings.length === 0 ? (
            <EmptyState
              title="No listings yet"
              message="Be the first student to post a textbook, calculator, or gear for sale on your campus!"
              actionText="Post First Listing"
              actionLink="/sell"
            />
          ) : (
            <div className="grid-listings stagger-grid">
              {featuredListings.map((listing) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3-STEP CAMPUS EXCHANGE FLOW */}
      <section ref={stepsRef} className={`home-section steps-section scroll-reveal ${stepsVisible ? 'reveal-visible' : ''}`}>
        <div className="container">
          <div className="section-header-centered">
            <span className="section-pill-tag">HOW IT WORKS</span>
            <h2 className="section-heading">Simple, Safe &amp; Direct Student Exchanges</h2>
            <p className="section-subheading">
              Skip commercial markups and slow shipping. Connect with classmates in three easy steps.
            </p>
          </div>

          <div className="steps-grid stagger-grid">
            {/* Step 1 */}
            <div className="step-card">
              <div className="step-icon-wrap">
                <UserCheck size={26} />
              </div>
              <div className="step-number">STEP 01</div>
              <h3 className="step-title">Sign In with Google</h3>
              <p className="step-desc">
                Log in securely using your campus Google credentials. Verified peer accounts ensure a safe and trustworthy university marketplace.
              </p>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <div className="step-icon-wrap">
                <PlusCircle size={26} />
              </div>
              <div className="step-number">STEP 02</div>
              <h3 className="step-title">List with Auto-Lookup</h3>
              <p className="step-desc">
                Snap a photo and set your asking price. For textbooks, our Google Books API auto-fills titles, authors, and cover art instantly.
              </p>
            </div>

            {/* Step 3 */}
            <div className="step-card">
              <div className="step-icon-wrap">
                <ShieldCheck size={26} />
              </div>
              <div className="step-number">STEP 03</div>
              <h3 className="step-title">Campus Handover &amp; Escrow</h3>
              <p className="step-desc">
                Meet safely at designated spots like the library or quad. Funds are held safely in escrow until you inspect the item and confirm handover.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ESCROW & TRUST BANNER */}
      <section ref={trustRef} className={`home-section trust-section scroll-reveal ${trustVisible ? 'reveal-visible' : ''}`}>
        <div className="container">
          <div className="trust-card-inner">
            <div className="trust-text-block">
              <div className="trust-pill-tag">
                <ShieldCheck size={14} /> ESCROW PROTECTED
              </div>
              <h3 className="trust-heading">Safe Campus Exchanges with Digital Escrow</h3>
              <p className="trust-description">
                Buyer funds are held safely until the item is received and inspected in person. No delivery scams, no risky cash meetups, instant resolution.
              </p>
            </div>
            <Link to="/browse" className="btn btn-primary btn-lg btn-pill trust-cta-btn">
              <span>Start Exploring</span>
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* SCOPED STYLES */}
      <style>{`
        .homepage-root {
          overflow-x: hidden;
        }

        /* Hero */
        .hero-section {
          background-color: var(--sage-light, #EDF2EB);
          padding: 5rem 0 5.5rem 0;
          border-bottom: 1px solid var(--border-color, #DDE3DA);
          position: relative;
          overflow: hidden;
        }

        .hero-ambient-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
          z-index: 0;
        }

        .hero-blob-1 {
          width: 320px;
          height: 320px;
          background: rgba(220, 231, 220, 0.7);
          top: -40px;
          left: -40px;
          animation: floatSlow 8s ease-in-out infinite;
        }

        .hero-blob-2 {
          width: 380px;
          height: 380px;
          background: rgba(250, 250, 246, 0.6);
          bottom: -60px;
          right: -40px;
          animation: floatSlow 10s ease-in-out infinite reverse;
        }

        .hero-container {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 960px;
        }

        .hero-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--sage-primary, #DCE7DC);
          border: 1px solid #CBD5CA;
          padding: 0.4rem 1.15rem;
          border-radius: var(--radius-full);
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--charcoal, #20231F);
          margin-bottom: 1.75rem;
        }

        .hero-badge-highlight {
          background-color: var(--charcoal, #20231F);
          color: #FFFFFF;
          font-size: 0.675rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: var(--radius-full);
          margin-left: 4px;
        }

        .hero-main-heading {
          font-size: clamp(2.4rem, 5.5vw, 4.2rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          color: var(--charcoal, #20231F);
          line-height: 1.12;
          margin-bottom: 1rem;
        }

        .hero-typewriter-row {
          min-height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .typewriter-text {
          font-size: clamp(1.2rem, 2.5vw, 1.8rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-muted, #747B72);
          display: inline-block;
        }

        .typewriter-blinking-cursor {
          display: inline-block;
          width: 3px;
          height: 1.4em;
          background-color: var(--charcoal, #20231F);
          margin-left: 4px;
          animation: cursorBlink 1s infinite;
          vertical-align: middle;
        }

        .hero-description {
          font-size: clamp(1rem, 1.5vw, 1.15rem);
          color: var(--text-muted, #747B72);
          max-width: 640px;
          margin: 0 auto 2.5rem auto;
          line-height: 1.65;
        }

        .hero-search-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 2.25rem;
        }

        .hero-cta-group {
          display: flex;
          justify-content: center;
          gap: 0.85rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .hero-primary-btn {
          gap: 0.5rem;
          font-weight: 700;
        }

        .hero-secondary-btn {
          gap: 0.5rem;
          font-weight: 700;
        }

        .hero-metrics-bar {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2.5rem;
          margin-top: 3.5rem;
          flex-wrap: wrap;
          border-top: 1px solid var(--border-color, #DDE3DA);
          padding-top: 2rem;
        }

        .metric-item {
          text-align: center;
        }

        .metric-value {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--charcoal, #20231F);
        }

        .metric-label {
          font-size: 0.75rem;
          color: var(--text-muted, #747B72);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-top: 2px;
        }

        .metric-divider {
          height: 24px;
          width: 1px;
          background-color: var(--border-color, #DDE3DA);
        }

        /* Sections */
        .home-section {
          padding: 5.5rem 0;
        }

        .categories-section {
          background-color: var(--warm-white, #FAFAF6);
        }

        .featured-section {
          background-color: var(--sage-light, #EDF2EB);
          border-top: 1px solid var(--border-color, #DDE3DA);
          border-bottom: 1px solid var(--border-color, #DDE3DA);
        }

        .steps-section {
          background-color: var(--warm-white, #FAFAF6);
        }

        .trust-section {
          padding: 4.5rem 0;
          background-color: var(--sage-light, #EDF2EB);
          border-top: 1px solid var(--border-color, #DDE3DA);
        }

        .section-header-centered {
          text-align: center;
          max-width: 620px;
          margin: 0 auto 3.5rem auto;
        }

        .section-pill-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--text-muted, #747B72);
          font-weight: 700;
          font-size: 0.785rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background-color: var(--sage-light, #EDF2EB);
          padding: 4px 12px;
          border-radius: var(--radius-full);
          margin-bottom: 0.85rem;
        }

        .section-heading {
          font-size: 2.35rem;
          letter-spacing: -0.03em;
          color: var(--charcoal, #20231F);
          margin-bottom: 0.65rem;
          line-height: 1.2;
        }

        .section-subheading {
          color: var(--text-muted, #747B72);
          font-size: 1.05rem;
          line-height: 1.6;
          margin: 0;
        }

        /* Category Cards */
        .categories-grid {
          display: grid;
          grid-templateColumns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 1.25rem;
        }

        .category-card {
          background-color: #FFFFFF;
          border: 1px solid var(--border-color, #DDE3DA);
          border-radius: 20px;
          padding: 2rem 1.25rem;
          text-align: center;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
          box-shadow: 0 1px 3px rgba(32, 35, 31, 0.04);
        }

        .category-card:hover {
          transform: translateY(-4px);
          border-color: var(--charcoal, #20231F);
          box-shadow: var(--shadow-md);
        }

        .cat-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background-color: var(--sage-light, #EDF2EB);
          color: var(--charcoal, #20231F);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.15rem;
          transition: all 0.25s ease;
        }

        .category-card:hover .cat-icon-wrapper {
          background-color: var(--sage-primary, #DCE7DC);
          transform: scale(1.08);
        }

        .cat-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--charcoal, #20231F);
          margin-bottom: 0.35rem;
        }

        .cat-description {
          font-size: 0.8rem;
          color: var(--text-muted, #747B72);
          line-height: 1.4;
        }

        /* Featured Grid */
        .featured-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .view-all-btn {
          padding: 0.55rem 1.25rem;
          gap: 0.45rem;
          font-weight: 600;
        }

        /* Steps */
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.75rem;
        }

        .step-card {
          background-color: #FFFFFF;
          border: 1px solid var(--border-color, #DDE3DA);
          border-radius: 24px;
          padding: 2.5rem 2rem;
          box-shadow: 0 2px 8px rgba(32, 35, 31, 0.04);
          transition: transform 0.25s ease, border-color 0.25s ease;
        }

        .step-card:hover {
          transform: translateY(-4px);
          border-color: var(--charcoal, #20231F);
          box-shadow: var(--shadow-md);
        }

        .step-icon-wrap {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          background-color: var(--sage-primary, #DCE7DC);
          color: var(--charcoal, #20231F);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .step-number {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-muted, #747B72);
          letter-spacing: 0.08em;
          margin-bottom: 0.35rem;
        }

        .step-title {
          font-size: 1.25rem;
          margin-bottom: 0.75rem;
          color: var(--charcoal, #20231F);
          font-weight: 700;
        }

        .step-desc {
          color: var(--text-muted, #747B72);
          font-size: 0.925rem;
          line-height: 1.6;
          margin: 0;
        }

        /* Trust Card */
        .trust-card-inner {
          background-color: var(--warm-white, #FAFAF6);
          border-radius: 32px;
          border: 1px solid var(--border-color, #DDE3DA);
          padding: 3.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 2rem;
          box-shadow: var(--shadow-sm);
        }

        .trust-text-block {
          max-width: 640px;
        }

        .trust-pill-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--charcoal, #20231F);
          background-color: var(--sage-primary, #DCE7DC);
          padding: 3px 10px;
          border-radius: var(--radius-full);
          margin-bottom: 0.85rem;
        }

        .trust-heading {
          font-size: 1.95rem;
          color: var(--charcoal, #20231F);
          margin-bottom: 0.75rem;
          font-weight: 800;
          line-height: 1.25;
        }

        .trust-description {
          color: var(--text-muted, #747B72);
          font-size: 1rem;
          margin: 0;
          line-height: 1.6;
        }

        .trust-cta-btn {
          gap: 0.5rem;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
