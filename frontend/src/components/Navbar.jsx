import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const navLinks = [
    { to: '/',            label: 'Home' },
    { to: '/problems',   label: 'Problems' },
    { to: '/contests',   label: 'Contests' },
    { to: '/leaderboard', label: 'Leaderboard' },
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 'var(--nav-h)',
      background: scrolled ? 'rgba(10,10,15,0.9)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <div className="container flex items-center justify-between" style={{ height: '100%' }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 900, color: '#fff',
          }}>⚡</div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>
            <span className="gradient-text">Code</span>Arena
          </span>
        </Link>

        {/* Desktop links */}
        <div className="flex items-center gap-4" style={{ display: 'flex' }}>
          {navLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'color 0.2s',
              padding: '6px 12px', borderRadius: '6px',
              background: isActive ? 'var(--bg-card)' : 'transparent',
            })}>
              {label}
            </NavLink>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 8,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                fontSize: '0.85rem', color: 'var(--text-secondary)',
                textDecoration: 'none', transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-1)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                }}>{user.fullName?.[0]?.toUpperCase()}</div>
                {user.fullName?.split(' ')[0]}
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
