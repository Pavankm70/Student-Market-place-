import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import {
  GraduationCap,
  PlusCircle,
  Package,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  Compass,
  Home,
  Heart,
  MessageSquare,
  ShoppingBag,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { savedCount } = useWishlist();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="navbar-root">
      <div className="navbar-container">
        {/* LEFT GROUP: Brand Logo & Title */}
        <div className="navbar-group-left">
          <Link to="/" className="navbar-brand-link" onClick={closeMenu}>
            <div className="navbar-brand-icon">
              <GraduationCap size={22} />
            </div>
            <div className="navbar-brand-text">
              <div className="navbar-brand-title">
                <span>CampusLoop</span>
                <span className="navbar-brand-pill">STUDENT</span>
              </div>
              <span className="navbar-brand-tagline">Campus Marketplace</span>
            </div>
          </Link>
        </div>

        {/* CENTER GROUP: Main Navigation Links */}
        <nav className="navbar-group-center desktop-nav-center">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `navbar-nav-item ${isActive ? 'active' : ''}`}
          >
            <Home size={15} />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/browse"
            className={({ isActive }) => `navbar-nav-item ${isActive ? 'active' : ''}`}
          >
            <Compass size={15} />
            <span>Marketplace</span>
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink
                to="/wishlist"
                className={({ isActive }) => `navbar-nav-item ${isActive ? 'active' : ''}`}
              >
                <Heart
                  size={15}
                  fill={savedCount > 0 ? '#E5A15B' : 'none'}
                  color={savedCount > 0 ? '#E5A15B' : 'currentColor'}
                />
                <span>Saved</span>
                {savedCount > 0 && (
                  <span className="navbar-counter-badge">{savedCount}</span>
                )}
              </NavLink>

              <NavLink
                to="/messages"
                className={({ isActive }) => `navbar-nav-item ${isActive ? 'active' : ''}`}
              >
                <MessageSquare size={15} />
                <span>Messages</span>
              </NavLink>

              <NavLink
                to="/sell"
                className={({ isActive }) => `navbar-nav-item nav-sell-item ${isActive ? 'active' : ''}`}
              >
                <PlusCircle size={15} />
                <span>Sell</span>
              </NavLink>

              <NavLink
                to="/my-listings"
                className={({ isActive }) => `navbar-nav-item ${isActive ? 'active' : ''}`}
              >
                <Package size={15} />
                <span>Listings</span>
              </NavLink>

              <NavLink
                to="/orders"
                className={({ isActive }) => `navbar-nav-item ${isActive ? 'active' : ''}`}
              >
                <ShoppingBag size={15} />
                <span>Orders</span>
              </NavLink>

              <NavLink
                to="/seller/dashboard"
                className={({ isActive }) => `navbar-nav-item ${isActive ? 'active' : ''}`}
              >
                <TrendingUp size={15} />
                <span>Dashboard</span>
              </NavLink>

              {user?.role === 'ROLE_SUPER_ADMIN' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `navbar-nav-item nav-admin-item ${isActive ? 'active' : ''}`}
                >
                  <ShieldAlert size={15} />
                  <span>Admin</span>
                </NavLink>
              )}
            </>
          )}
        </nav>

        {/* RIGHT GROUP: User Profile / Auth / Logout */}
        <div className="navbar-group-right">
          {isAuthenticated ? (
            <div className="navbar-auth-controls">
              <Link to="/profile" className="navbar-user-card" title="View Profile">
                <div className="navbar-user-avatar">
                  {user?.name ? user.name.trim().charAt(0).toUpperCase() : <User size={15} />}
                </div>
                <div className="navbar-user-text">
                  <span className="navbar-user-name" title={user?.name}>
                    {user?.name || 'Student'}
                  </span>
                  <span className="navbar-user-role">
                    {user?.role === 'ROLE_SUPER_ADMIN' ? 'Super Admin' : `Student #${user?.sellerId || user?.id || ''}`}
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="navbar-logout-btn"
                title="Log out of your account"
                aria-label="Logout"
              >
                <LogOut size={15} />
                <span className="navbar-logout-text">Logout</span>
              </button>
            </div>
          ) : (
            <div className="navbar-guest-controls">
              <Link to="/login" className="btn btn-sm btn-outline navbar-guest-btn">
                <LogIn size={15} />
                <span>Login</span>
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary navbar-guest-btn">
                <UserPlus size={15} />
                <span>Register</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="navbar-mobile-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER MENU */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-drawer">
          <div className="mobile-drawer-content">
            {isAuthenticated && (
              <div className="mobile-user-banner">
                <div className="mobile-user-avatar">
                  {user?.name ? user.name.trim().charAt(0).toUpperCase() : <User size={18} />}
                </div>
                <div className="mobile-user-details">
                  <span className="mobile-user-name">{user?.name}</span>
                  <span className="mobile-user-email">{user?.email}</span>
                  <span className="mobile-user-badge">
                    {user?.role === 'ROLE_SUPER_ADMIN' ? 'Super Admin' : 'Verified Student'}
                  </span>
                </div>
              </div>
            )}

            <div className="mobile-nav-links">
              <Link to="/" onClick={closeMenu} className="mobile-nav-link">
                <Home size={18} />
                <span>Home</span>
              </Link>
              <Link to="/browse" onClick={closeMenu} className="mobile-nav-link">
                <Compass size={18} />
                <span>Browse Marketplace</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <Link to="/wishlist" onClick={closeMenu} className="mobile-nav-link">
                    <Heart size={18} color="#E5A15B" fill={savedCount > 0 ? '#E5A15B' : 'none'} />
                    <span>Saved Listings</span>
                    {savedCount > 0 && (
                      <span className="navbar-counter-badge" style={{ marginLeft: 'auto' }}>
                        {savedCount}
                      </span>
                    )}
                  </Link>

                  <Link to="/messages" onClick={closeMenu} className="mobile-nav-link">
                    <MessageSquare size={18} />
                    <span>Messages &amp; Inquiries</span>
                  </Link>

                  <Link to="/sell" onClick={closeMenu} className="mobile-nav-link mobile-sell-link">
                    <PlusCircle size={18} />
                    <span>Sell an Item</span>
                  </Link>

                  <Link to="/my-listings" onClick={closeMenu} className="mobile-nav-link">
                    <Package size={18} />
                    <span>My Listings</span>
                  </Link>

                  <Link to="/orders" onClick={closeMenu} className="mobile-nav-link">
                    <ShoppingBag size={18} />
                    <span>My Orders</span>
                  </Link>

                  <Link to="/seller/dashboard" onClick={closeMenu} className="mobile-nav-link">
                    <TrendingUp size={18} />
                    <span>Seller Dashboard</span>
                  </Link>

                  {user?.role === 'ROLE_SUPER_ADMIN' && (
                    <Link to="/admin" onClick={closeMenu} className="mobile-nav-link mobile-admin-link">
                      <ShieldAlert size={18} />
                      <span>Admin Portal</span>
                    </Link>
                  )}

                  <Link to="/profile" onClick={closeMenu} className="mobile-nav-link">
                    <User size={18} />
                    <span>My Profile</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mobile-nav-link mobile-logout-btn"
                  >
                    <LogOut size={18} />
                    <span>Log Out</span>
                  </button>
                </>
              ) : (
                <div className="mobile-guest-buttons">
                  <Link to="/login" onClick={closeMenu} className="btn btn-outline" style={{ width: '100%' }}>
                    <LogIn size={18} />
                    <span>Login</span>
                  </Link>
                  <Link to="/register" onClick={closeMenu} className="btn btn-primary" style={{ width: '100%' }}>
                    <UserPlus size={18} />
                    <span>Register Account</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE SCOPED NAVBAR CSS */}
      <style>{`
        .navbar-root {
          background-color: rgba(237, 242, 235, 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-color, #DDE3DA);
          position: sticky;
          top: 0;
          z-index: 1000;
          height: 72px;
          display: flex;
          align-items: center;
          transition: background-color 0.2s ease;
          width: 100%;
        }

        .navbar-container {
          width: 100%;
          max-width: 1360px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          gap: 1rem;
        }

        /* LEFT GROUP */
        .navbar-group-left {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .navbar-brand-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          user-select: none;
        }

        .navbar-brand-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background-color: var(--charcoal, #20231F);
          color: var(--sage-primary, #DCE7DC);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(32, 35, 31, 0.12);
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }

        .navbar-brand-link:hover .navbar-brand-icon {
          transform: scale(1.05);
        }

        .navbar-brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }

        .navbar-brand-title {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--charcoal, #20231F);
          letter-spacing: -0.03em;
        }

        .navbar-brand-pill {
          font-size: 0.625rem;
          font-weight: 800;
          background-color: var(--sage-primary, #DCE7DC);
          color: var(--charcoal, #20231F);
          padding: 2px 6px;
          border-radius: 6px;
          letter-spacing: 0.04em;
        }

        .navbar-brand-tagline {
          font-size: 0.72rem;
          color: var(--text-muted, #747B72);
          font-weight: 500;
        }

        /* CENTER GROUP */
        .navbar-group-center {
          display: none;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          flex: 1 1 auto;
          min-width: 0;
        }

        @media (min-width: 1080px) {
          .navbar-group-center {
            display: flex;
          }
        }

        .navbar-nav-item {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.8rem;
          border-radius: 9999px;
          font-size: 0.865rem;
          font-weight: 600;
          color: var(--text-muted, #747B72);
          text-decoration: none;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
          border: 1px solid transparent;
        }

        .navbar-nav-item:hover {
          color: var(--charcoal, #20231F);
          background-color: var(--sage-light, #EDF2EB);
        }

        .navbar-nav-item.active {
          color: var(--charcoal, #20231F);
          background-color: var(--sage-primary, #DCE7DC);
          border-color: #CBD5CA;
          font-weight: 700;
        }

        .nav-sell-item {
          background-color: var(--charcoal, #20231F);
          color: #FFFFFF !important;
          font-weight: 700;
          padding: 0.45rem 0.95rem;
          box-shadow: 0 2px 6px rgba(32, 35, 31, 0.15);
          margin: 0 0.2rem;
        }

        .nav-sell-item:hover {
          background-color: var(--charcoal-hover, #111311) !important;
          transform: translateY(-1px);
        }

        .nav-admin-item {
          color: #C24A3F !important;
          background-color: #FDF1F0;
          border-color: #F5CAC6;
        }

        .nav-admin-item.active {
          background-color: #C24A3F !important;
          color: #FFFFFF !important;
        }

        .navbar-counter-badge {
          background-color: var(--accent-orange, #E5A15B);
          color: #FFFFFF;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 9999px;
          line-height: 1.2;
        }

        /* RIGHT GROUP */
        .navbar-group-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .navbar-auth-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .navbar-user-card {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          text-decoration: none;
          padding: 0.3rem 0.65rem 0.3rem 0.35rem;
          border-radius: 9999px;
          background-color: rgba(255, 255, 255, 0.65);
          border: 1px solid var(--border-color, #DDE3DA);
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .navbar-user-card:hover {
          background-color: #FFFFFF;
          border-color: var(--charcoal, #20231F);
          box-shadow: var(--shadow-xs);
        }

        .navbar-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--sage-primary, #DCE7DC);
          color: var(--charcoal, #20231F);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 800;
          flex-shrink: 0;
        }

        .navbar-user-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: left;
          line-height: 1.2;
          max-width: 130px;
          overflow: hidden;
        }

        .navbar-user-name {
          font-size: 0.825rem;
          font-weight: 700;
          color: var(--charcoal, #20231F);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }

        .navbar-user-role {
          font-size: 0.685rem;
          color: var(--text-muted, #747B72);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .navbar-logout-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.42rem 0.85rem;
          border-radius: 9999px;
          background-color: #FFFFFF;
          border: 1px solid var(--border-color, #DDE3DA);
          color: var(--charcoal, #20231F);
          font-size: 0.825rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .navbar-logout-btn:hover {
          background-color: #FDF1F0;
          border-color: #F5CAC6;
          color: #C24A3F;
          transform: translateY(-1px);
        }

        .navbar-guest-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .navbar-guest-btn {
          padding: 0.42rem 0.95rem;
        }

        .navbar-mobile-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          background: var(--sage-light, #EDF2EB);
          border: 1px solid var(--border-color, #DDE3DA);
          border-radius: 12px;
          cursor: pointer;
          color: var(--charcoal, #20231F);
          transition: all 0.2s ease;
        }

        .navbar-mobile-toggle:hover {
          background-color: var(--sage-primary, #DCE7DC);
        }

        @media (min-width: 1080px) {
          .navbar-mobile-toggle {
            display: none !important;
          }
        }

        /* MOBILE DRAWER */
        .navbar-mobile-drawer {
          position: absolute;
          top: 72px;
          left: 0;
          right: 0;
          background: #FAFAF6;
          border-bottom: 1px solid var(--border-color, #DDE3DA);
          box-shadow: 0 20px 40px rgba(32, 35, 31, 0.12);
          animation: fadeIn 0.2s ease-out;
          max-height: calc(100vh - 72px);
          overflow-y: auto;
          z-index: 999;
        }

        .mobile-drawer-content {
          padding: 1.25rem 1.5rem 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          max-width: 500px;
          margin: 0 auto;
        }

        .mobile-user-banner {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.85rem 1rem;
          background: #EDF2EB;
          border-radius: 16px;
          border: 1px solid var(--border-color, #DDE3DA);
          margin-bottom: 0.5rem;
        }

        .mobile-user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--charcoal, #20231F);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 800;
          flex-shrink: 0;
        }

        .mobile-user-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .mobile-user-name {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--charcoal, #20231F);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mobile-user-email {
          font-size: 0.785rem;
          color: var(--text-muted, #747B72);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mobile-user-badge {
          font-size: 0.685rem;
          font-weight: 700;
          color: var(--success-text, #235436);
        }

        .mobile-nav-links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 14px;
          background: #FFFFFF;
          border: 1px solid var(--border-color, #DDE3DA);
          color: var(--charcoal, #20231F);
          font-size: 0.925rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.18s ease;
        }

        .mobile-nav-link:hover {
          background-color: var(--sage-light, #EDF2EB);
        }

        .mobile-sell-link {
          background-color: var(--charcoal, #20231F) !important;
          color: #FFFFFF !important;
          border-color: var(--charcoal, #20231F) !important;
        }

        .mobile-admin-link {
          background-color: #FDF1F0 !important;
          color: #C24A3F !important;
          border-color: #F5CAC6 !important;
        }

        .mobile-logout-btn {
          width: 100%;
          background-color: #FDF1F0 !important;
          color: #C24A3F !important;
          border-color: #F5CAC6 !important;
          cursor: pointer;
          margin-top: 0.5rem;
        }

        .mobile-guest-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          margin-top: 0.5rem;
        }
      `}</style>
    </header>
  );
};

export default Navbar;
