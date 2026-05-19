import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

function CountdownTimer({ targetTime, label }) {
  const [diff, setDiff] = useState(Math.max(0, new Date(targetTime) - Date.now()));

  useEffect(() => {
    const t = setInterval(() => {
      const d = Math.max(0, new Date(targetTime) - Date.now());
      setDiff(d);
      if (d === 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [targetTime]);

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: 'var(--accent-1)' }}>
        {pad(h)}:{pad(m)}:{pad(s)}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    ongoing:  { color: 'var(--easy)',   bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)',  label: '● Live' },
    upcoming: { color: 'var(--medium)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: '◷ Upcoming' },
    ended:    { color: 'var(--text-muted)', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)', label: 'Ended' },
  }[status] || {};

  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
}

function ContestCard({ contest, i }) {
  const now = new Date();
  const start = new Date(contest.startTime);
  const end   = new Date(contest.endTime);

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06 }}
      className="glass"
      style={{ padding: '22px 28px' }}
      whileHover={{ y: -2, borderColor: 'var(--border-hover)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <StatusBadge status={contest.status} />
            {contest.createdBy && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                by {contest.createdBy.fullName}
              </span>
            )}
          </div>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>{contest.title}</h3>
          {contest.description && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 12 }}>
              {contest.description.slice(0, 120)}{contest.description.length > 120 ? '...' : ''}
            </p>
          )}
          <div style={{ display: 'flex', gap: 20, fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span>🕐 Start: {formatDate(contest.startTime)}</span>
            <span>🏁 End: {formatDate(contest.endTime)}</span>
            <span>⏱ Penalty: {contest.penaltyMinutes}min/wrong</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
          {contest.status === 'upcoming' && (
            <CountdownTimer targetTime={start} label="Starts in" />
          )}
          {contest.status === 'ongoing' && (
            <CountdownTimer targetTime={end} label="Ends in" />
          )}
          <Link
            to={`/contests/${contest._id}`}
            className={`btn btn-sm ${contest.status === 'ongoing' ? 'btn-primary' : 'btn-secondary'}`}
          >
            {contest.status === 'ongoing' ? '⚡ Join' : contest.status === 'upcoming' ? 'View' : 'Results'}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function Contests() {
  const [contests, setContests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');

  useEffect(() => {
    api.get('/contests')
      .then(({ data }) => setContests(data.contests))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? contests
    : contests.filter((c) => c.status === filter);

  const TABS = [
    { key: 'all',      label: 'All' },
    { key: 'ongoing',  label: '● Live' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'ended',    label: 'Ended' },
  ];

  return (
    <div className="page" style={{ paddingTop: 'calc(var(--nav-h) + 40px)', paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 900 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 className="section-title">⚡ Con<span className="gradient-text">tests</span></h1>
          <p className="section-sub">Compete with others in timed coding challenges</p>
        </motion.div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} className="btn btn-sm" style={{
              background: filter === key ? 'var(--gradient)' : 'var(--bg-card)',
              border:     filter === key ? 'none'            : '1px solid var(--border)',
              color:      filter === key ? '#fff'            : 'var(--text-secondary)',
            }}>{label}</button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading contests...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="glass" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🏁</div>
            <h3 style={{ marginBottom: 8 }}>No contests found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Check back later for upcoming contests.</p>
          </div>
        )}

        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((c, i) => <ContestCard key={c._id} contest={c} i={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
