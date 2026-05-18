import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Heatmap from '../components/Heatmap';
import api from '../services/api';

const DIFFICULTY_COLORS = {
  Easy:   { color: 'var(--easy)',   bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)' },
  Medium: { color: 'var(--medium)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  Hard:   { color: 'var(--hard)',   bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)' },
};

function StatRing({ label, solved, total, color }) {
  const pct = total > 0 ? (solved / total) * 100 : 0;
  const r = 28, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color, lineHeight: 1 }}>{solved}</span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>/{total}</span>
        </div>
      </div>
      <span style={{
        fontSize: '0.72rem', fontWeight: 600, color,
        background: DIFFICULTY_COLORS[label]?.bg,
        border: `1px solid ${DIFFICULTY_COLORS[label]?.border}`,
        padding: '2px 8px', borderRadius: 20,
      }}>{label}</span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div style={{
      height: 42, borderRadius: 8, marginBottom: 8,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats]       = useState(null);
  const [solved, setSolved]     = useState([]);
  const [activity, setActivity] = useState({});
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [diffFilter, setDiff]   = useState('All');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get('/profile/stats'),
      api.get('/profile/solved'),
      api.get('/profile/activity'),
    ])
      .then(([statsRes, solvedRes, actRes]) => {
        setStats(statsRes.data.stats);
        setSolved(solvedRes.data.solved);
        setActivity(actRes.data.activity);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const filteredSolved = solved.filter((p) => {
    const matchDiff   = diffFilter === 'All' || p.difficulty === diffFilter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchDiff && matchSearch;
  });

  const langIcons = { cpp: '⚙️', python: '🐍', java: '☕', javascript: '🟨' };

  if (!user) {
    return (
      <div className="page flex items-center" style={{ justifyContent: 'center', minHeight: '100vh' }}>
        <div className="glass" style={{ padding: '40px 48px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>🔒</div>
          <h2 style={{ marginBottom: 12 }}>Sign in to view your profile</h2>
          <Link to="/login" className="btn btn-primary">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingTop: 'calc(var(--nav-h) + 32px)', paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 1100 }}>

        {/* ── Header Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass" style={{ padding: '28px 32px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}
        >
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 800, color: '#fff', flexShrink: 0,
            boxShadow: '0 0 32px rgba(124,58,237,0.35)',
          }}>
            {user.fullName?.[0]?.toUpperCase() || '?'}
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>{user.fullName}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.email}</p>
            {user.dob && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4 }}>
                🎂 {new Date(user.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>

          {/* Quick stats */}
          {stats && (
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Solved',       value: stats.totalSolved,      icon: '✅' },
                { label: 'Submissions',  value: stats.totalSubmissions,  icon: '📤' },
                { label: 'Acceptance',   value: `${stats.acceptanceRate}%`, icon: '🎯' },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{icon} {label}</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Main Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>

          {/* ── Left: Difficulty rings ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="glass" style={{ padding: 24 }}
            >
              <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 20 }}>
                Problems Solved
              </h3>

              {loading ? (
                <div className="spinner" style={{ margin: '20px auto' }} />
              ) : stats ? (
                <>
                  {/* Total big number */}
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }} className="gradient-text">
                      {stats.totalSolved}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      of {stats.totalProblems} problems
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginTop: 12 }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        background: 'var(--gradient)',
                        width: `${Math.min(100, (stats.totalSolved / stats.totalProblems) * 100)}%`,
                        transition: 'width 1s ease',
                      }} />
                    </div>
                  </div>

                  {/* Difficulty rings */}
                  <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                    <StatRing label="Easy"   solved={stats.easy.solved}   total={stats.easy.total}   color="var(--easy)"   />
                    <StatRing label="Medium" solved={stats.medium.solved} total={stats.medium.total} color="var(--medium)" />
                    <StatRing label="Hard"   solved={stats.hard.solved}   total={stats.hard.total}   color="var(--hard)"   />
                  </div>
                </>
              ) : null}
            </motion.div>

            {/* Skills summary */}
            {stats && !loading && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="glass" style={{ padding: 24 }}
              >
                <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>
                  Breakdown
                </h3>
                {[
                  { label: 'Easy',   ...stats.easy,   color: 'var(--easy)'   },
                  { label: 'Medium', ...stats.medium, color: 'var(--medium)' },
                  { label: 'Hard',   ...stats.hard,   color: 'var(--hard)'   },
                ].map(({ label, solved: s, total: t, color }) => (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: '0.82rem', color }}>{label}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{s}/{t}</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                      <div style={{
                        height: '100%', borderRadius: 3, background: color,
                        width: `${t > 0 ? (s / t) * 100 : 0}%`,
                        opacity: 0.85, transition: 'width 1s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* ── Right: Heatmap + Solved list ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Heatmap */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="glass" style={{ padding: 24 }}
            >
              <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>
                Submission Activity
              </h3>
              {loading ? <div className="spinner" style={{ margin: '20px auto' }} /> : <Heatmap activity={activity} />}
            </motion.div>

            {/* Solved Problems List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass" style={{ padding: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Solved Problems ({filteredSolved.length})
                </h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {/* Search */}
                  <div className="search-bar" style={{ padding: '6px 12px', flex: 1, minWidth: 160 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ fontSize: '0.8rem' }} />
                  </div>
                  {/* Difficulty filter */}
                  {['All','Easy','Medium','Hard'].map((d) => (
                    <button key={d} onClick={() => setDiff(d)} className="btn btn-sm" style={{
                      fontSize: '0.72rem', padding: '4px 12px',
                      background: diffFilter === d ? 'var(--gradient)' : 'var(--bg-card)',
                      border: diffFilter === d ? 'none' : '1px solid var(--border)',
                      color: diffFilter === d ? '#fff' : 'var(--text-secondary)',
                    }}>{d}</button>
                  ))}
                </div>
              </div>

              {loading ? (
                <>
                  <SkeletonRow /><SkeletonRow /><SkeletonRow />
                  <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
                </>
              ) : filteredSolved.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                  {solved.length === 0 ? '🚀 Start solving problems to see them here!' : '😕 No matches found.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredSolved.map((p, i) => {
                    const dc = DIFFICULTY_COLORS[p.difficulty] || {};
                    return (
                      <motion.div
                        key={p._id}
                        initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', borderRadius: 8,
                          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                          transition: 'border-color 0.2s',
                          gap: 12,
                        }}
                        whileHover={{ borderColor: 'var(--border-hover)' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.85rem' }}>✅</span>
                          <Link to={`/problems/${p._id}`} style={{
                            textDecoration: 'none', color: 'var(--text-primary)',
                            fontWeight: 500, fontSize: '0.88rem',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{p.name}</Link>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 600, color: dc.color,
                            background: dc.bg, border: `1px solid ${dc.border}`,
                            padding: '2px 8px', borderRadius: 20,
                          }}>{p.difficulty}</span>
                          <span style={{ fontSize: '0.78rem' }} title={p.language}>
                            {langIcons[p.language] || '📝'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {new Date(p.solvedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
