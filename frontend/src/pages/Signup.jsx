import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', dob: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const { fullName, email, password, dob } = form;
    if (!fullName || !email || !password || !dob) return setError('All fields are required.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await signup(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page flex items-center" style={{ justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{
        position: 'fixed', top: '30%', right: '20%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
      }} />

      <motion.div
        initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass"
        style={{ width: '100%', maxWidth: 460, padding: '44px 40px', position: 'relative', zIndex: 1 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'var(--gradient)', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: 12,
          }}>⚡</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 6 }}>
            Join CodeArena and start practicing
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              id="signup-name" name="fullName" type="text"
              className="form-input" placeholder="John Doe"
              value={form.fullName} onChange={handle}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              id="signup-email" name="email" type="email"
              className="form-input" placeholder="you@example.com"
              value={form.email} onChange={handle}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="signup-password" name="password" type="password"
              className="form-input" placeholder="Min. 6 characters"
              value={form.password} onChange={handle}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input
              id="signup-dob" name="dob" type="date"
              className="form-input"
              value={form.dob} onChange={handle}
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', color: 'var(--hard)',
              }}
            >{error}</motion.div>
          )}

          <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center', marginTop: 4 }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-1)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
