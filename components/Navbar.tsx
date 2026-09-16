'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.85rem 2rem',
      background: '#113666', // Matching theme dark blue header
      color: '#ffffff',
      position: 'relative',
      boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
    }}>
      {/* Home link on left */}
      <div style={{ width: '40px' }}>
        <Link href="/" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem', opacity: 0.9 }}>
          Home
        </Link>
      </div>

      {/* Center Heading */}
      <h1 style={{
        fontSize: '1.4rem',
        fontWeight: 700,
        margin: 0,
        textAlign: 'center',
        color: '#ffffff',
        letterSpacing: '0.5px'
      }}>
        Placement Brochure
      </h1>

      {/* Top Right Gear Settings Icon */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Settings Menu"
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {/* Theme-matched SVG Gear Icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>

        {/* Gear Dropdown Menu - Single Admin Option */}
        {menuOpen && (
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'absolute',
              right: 0,
              top: '125%',
              background: '#ffffff',
              color: '#1f2937',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)',
              borderRadius: '8px',
              width: '180px',
              zIndex: 9999,
              overflow: 'hidden',
              border: '1px solid #e5e7eb'
            }}
          >
            <div style={{ padding: '0.6rem 1rem', background: '#f3f4f6', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Admin Options
            </div>
            
            <button
              onClick={() => {
                setMenuOpen(false);
                router.push('/admin');
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.8rem 1rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '0.95rem',
                display: 'block',
                color: '#111827',
                fontWeight: 500,
              }}
            >
              Admin Panel
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
