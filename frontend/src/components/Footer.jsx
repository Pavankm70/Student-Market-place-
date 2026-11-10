import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, ArrowUpRight, CheckCircle2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: '#20231F',
        color: '#9DA69B',
        borderTop: '1px solid #2F352E',
        marginTop: 'auto',
        padding: '4.5rem 0 2.5rem 0',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '3rem',
            marginBottom: '3.5rem',
          }}
        >
          {/* Brand & Mission */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#DCE7DC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#20231F',
                }}
              >
                <GraduationCap size={20} />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FAFAF6' }}>
                CampusLoop
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: '#9DA69B', marginBottom: '1.5rem' }}>
              The minimalist campus marketplace for university students. Discover, buy, and sell textbooks, electronics, and dorm essentials with verified in-person handoffs.
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                color: '#DCE7DC',
                backgroundColor: 'rgba(220, 231, 220, 0.1)',
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                border: '1px solid rgba(220, 231, 220, 0.2)',
              }}
            >
              <ShieldCheck size={15} /> 100% Student Verified Campus Safe
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 style={{ color: '#FAFAF6', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Marketplace Categories
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li>
                <Link to="/browse?category=BOOKS" className="footer-link">
                  Textbooks &amp; Course Materials
                </Link>
              </li>
              <li>
                <Link to="/browse?category=ELECTRONICS" className="footer-link">
                  Electronics, Laptops &amp; Tech
                </Link>
              </li>
              <li>
                <Link to="/browse?category=LAB_SUPPLIES" className="footer-link">
                  Lab Coats &amp; Supplies
                </Link>
              </li>
              <li>
                <Link to="/browse?category=FURNITURE" className="footer-link">
                  Dorm Desks, Chairs &amp; Gear
                </Link>
              </li>
              <li>
                <Link to="/browse?category=STATIONERY" className="footer-link">
                  Stationery &amp; Kits
                </Link>
              </li>
            </ul>
          </div>

          {/* Safety Protocols */}
          <div>
            <h4 style={{ color: '#FAFAF6', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Safe Campus Meetups
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#9DA69B' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="#DCE7DC" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Meet at public campus spots like University Library or Quad.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="#DCE7DC" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Inspect book editions, markings, and condition before handover.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="#DCE7DC" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Test electronic devices and calculators in person.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="#DCE7DC" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Campus Escrow protects funds until physical handover is confirmed.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid #2F352E',
            paddingTop: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>© {new Date().getFullYear()} CampusLoop. Designed for student campus communities.</span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/browse" className="footer-link">All Listings</Link>
            <Link to="/sell" className="footer-link">List an Item</Link>
            <a
              href={`${(import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '')}/swagger-ui/index.html`}
              target="_blank"
              rel="noreferrer"
              className="footer-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
            >
              API Docs <ArrowUpRight size={13} />
            </a>
            <a
              href={`${(import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '')}/api/health`}
              target="_blank"
              rel="noreferrer"
              className="footer-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
            >
              System Health <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .footer-link {
          color: #9DA69B;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .footer-link:hover {
          color: #FAFAF6;
          transform: translateX(2px);
        }
      `}</style>
    </footer>
  );
};

export default Footer;
