import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/* ── Medal config ── */
const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = [
  { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  text: '#fbbf24' },
  { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)', text: '#94a3b8' },
  { bg: 'rgba(180,83,9,0.12)',    border: 'rgba(180,83,9,0.3)',    text: '#b45309'  },
];

/* ── Avatar chip ── */
function Avatar({ initials, rank, size = 38 }) {
  const isTop3 = rank <= 3;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: isTop3
        ? `radial-gradient(135deg, ${RANK_COLORS[rank - 1].text}55, ${RANK_COLORS[rank - 1].text}22)`
        : 'var(--gradient)',
      border: isTop3 ? `2px solid ${RANK_COLORS[rank - 1].border}` : '2px solid rgba(124,58,237,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#fff',
      boxShadow: isTop3 ? `0 0 16px ${RANK_COLORS[rank - 1].text}44` : 'none',
    }}>
      {initials}
    </div>
  );
}

/* ── Rank badge ── */
function RankBadge({ rank }) {
  if (rank <= 3) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40 }}>
        <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>
          {MEDALS[rank - 1]}
        </span>
      </div>
    );
  }
  return (
    <div style={{
      width: 40, textAlign: 'center',
      fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
      fontWeight: 600, color: 'var(--text-muted)',
    }}>#{rank}</div>
  );
}

/* ── Difficulty pills ── */
function DiffPills({ easy, medium, hard }) {
  const pills = [
    { label: `${easy}E`,   color: 'var(--easy)',   bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)'  },
    { label: `${medium}M`, color: 'var(--medium)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
    { label: `${hard}H`,   color: 'var(--hard)',   bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)'  },
  ];
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {pills.map(({ label, color, bg, border }) => (
        <span key={label} style={{
          fontSize: '0.7rem', fontWeight: 600, padding: '2px 7px',
          borderRadius: 20, color, background: bg,
          border: `1px solid ${border}`,
          fontFamily: 'var(--font-mono)',
        }}>{label}</span>
      ))}
    </div>
  );
}

/* ── Score bar ── */
function ScoreBar({ score, maxScore }) {
  const pct = maxScore > 0 ? Math.min(100, (score / maxScore) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', minWidth: 40, textAlign: 'right' }}>
        {score}
      </span>
      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, minWidth: 60 }}>
        <div style={{
          height: '100%', borderRadius: 3,
          background: 'var(--gradient)',
          width: `${pct}%`,
          transition: 'width 0.8s ease',
          boxShadow: pct > 0 ? '0 0 8px rgba(124,58,237,0.5)' : 'none',
        }} />
      </div>
    </div>
  );
}

/* ── Accuracy badge ── */
function AccuracyBadge({ pct }) {
  const color = pct >= 70 ? 'var(--easy)' : pct >= 40 ? 'var(--medium)' : 'var(--hard)';
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.85rem', color }}>
      {pct}%
    </span>
  );
}

/* ── Main Component ── */
export default function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows]         = useState([]);
  const [pagination, setPag]    = useState({ page: 1, totalPages: 1, totalUsers: 0 });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [page, setPage]         = useState(1);
  const [maxScore, setMaxScore] = useState(1);

  const fetchLeaderboard = useCallback(async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/leaderboard?page=${p}&limit=20`);
      setRows(data.leaderboard);
      setPag(data.pagination);
      if (data.leaderboard.length > 0) {
        setMaxScore(data.leaderboard[0].score || 1);
      }
    } catch {
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeaderboard(page); }, [page]);

  const isCurrentUser = (row) => user && row.fullName === user.fullName;

  return (
    <div className="page" style={{ paddingTop: 'calc(var(--nav-h) + 40px)', paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 960 }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 36 }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 className="section-title">
                🏆 Leader<span className="gradient-text">board</span>
              </h1>
              <p className="section-sub">
                {pagination.totalUsers > 0
                  ? `${pagination.totalUsers} coders ranked by score`
                  : 'Ranked by problems solved and difficulty'}
              </p>
            </div>
            <button
              onClick={() => fetchLeaderboard(page)}
              className="btn btn-secondary btn-sm"
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          {/* Scoring legend */}
          <div style={{
            display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap',
          }}>
            {[
              { label: 'Easy',   points: 10, color: 'var(--easy)',   bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)'  },
              { label: 'Medium', points: 20, color: 'var(--medium)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
              { label: 'Hard',   points: 30, color: 'var(--hard)',   bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)'  },
            ].map(({ label, points, color, bg, border }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 8,
                background: bg, border: `1px solid ${border}`,
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color }}>{label}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>= {points} pts</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: 20, color: 'var(--hard)', textAlign: 'center', marginBottom: 24,
          }}>{error}</div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                height: 68, borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                animation: 'pulse 1.5s ease infinite',
                animationDelay: `${i * 0.08}s`,
              }} />
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.7} }`}</style>
          </div>
        )}

        {/* ── Leaderboard table ── */}
        {!loading && !error && (
          <>
            {rows.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass"
                style={{ padding: '60px 24px', textAlign: 'center' }}
              >
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚀</div>
                <h3 style={{ marginBottom: 8 }}>No submissions yet</h3>
                <p style={{ color: 'var(--text-muted)' }}>Be the first to solve a problem and claim the #1 spot!</p>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Column headers */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '52px 1fr 110px 100px 90px 160px',
                  gap: 12, padding: '8px 20px',
                  fontSize: '0.7rem', fontWeight: 600,
                  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  <div style={{ textAlign: 'center' }}>Rank</div>
                  <div>User</div>
                  <div style={{ textAlign: 'center' }}>Solved</div>
                  <div style={{ textAlign: 'center' }}>Attempts</div>
                  <div style={{ textAlign: 'center' }}>Accuracy</div>
                  <div style={{ paddingLeft: 8 }}>Score</div>
                </div>

                <AnimatePresence>
                  {rows.map((row, i) => {
                    const isMe    = isCurrentUser(row);
                    const isTop3  = row.rank <= 3;
                    const rankClr = isTop3 ? RANK_COLORS[row.rank - 1] : null;

                    return (
                      <motion.div
                        key={`${row.fullName}-${row.rank}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.04 }}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '52px 1fr 110px 100px 90px 160px',
                          gap: 12,
                          alignItems: 'center',
                          padding: '14px 20px',
                          borderRadius: 12,
                          background: isMe
                            ? 'rgba(124,58,237,0.1)'
                            : isTop3
                              ? rankClr.bg
                              : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${
                            isMe
                              ? 'rgba(124,58,237,0.4)'
                              : isTop3
                                ? rankClr.border
                                : 'var(--border)'
                          }`,
                          boxShadow: isMe ? '0 0 20px rgba(124,58,237,0.15)' : 'none',
                          transition: 'transform 0.15s, box-shadow 0.15s',
                          cursor: 'default',
                        }}
                        whileHover={{ transform: 'translateX(4px)', boxShadow: isMe ? '0 0 24px rgba(124,58,237,0.2)' : '0 2px 12px rgba(0,0,0,0.2)' }}
                      >
                        {/* Rank */}
                        <RankBadge rank={row.rank} />

                        {/* User */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                          <Avatar initials={row.initials} rank={row.rank} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontWeight: 600, fontSize: '0.9rem',
                              color: isMe ? '#a78bfa' : isTop3 ? rankClr.text : 'var(--text-primary)',
                              display: 'flex', alignItems: 'center', gap: 8,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {row.fullName}
                              {isMe && (
                                <span style={{
                                  fontSize: '0.65rem', padding: '1px 7px', borderRadius: 20,
                                  background: 'rgba(124,58,237,0.25)', color: '#a78bfa',
                                  border: '1px solid rgba(124,58,237,0.4)', fontWeight: 600,
                                }}>You</span>
                              )}
                            </div>
                            <DiffPills easy={row.easySolved} medium={row.mediumSolved} hard={row.hardSolved} />
                          </div>
                        </div>

                        {/* Solved */}
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
                            {row.totalSolved}
                          </span>
                        </div>

                        {/* Attempts */}
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                          {row.totalAttempts}
                        </div>

                        {/* Accuracy */}
                        <div style={{ textAlign: 'center' }}>
                          <AccuracyBadge pct={row.accuracy} />
                        </div>

                        {/* Score bar */}
                        <ScoreBar score={row.score} maxScore={maxScore} />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* ── Pagination ── */}
            {pagination.totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 32 }}
              >
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn btn-secondary btn-sm"
                >← Prev</button>

                <div style={{ display: 'flex', gap: 6 }}>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - page) <= 2)
                    .map((p) => (
                      <button key={p} onClick={() => setPage(p)} className="btn btn-sm" style={{
                        background: p === page ? 'var(--gradient)' : 'var(--bg-card)',
                        border: p === page ? 'none' : '1px solid var(--border)',
                        color: p === page ? '#fff' : 'var(--text-secondary)',
                        minWidth: 36,
                      }}>{p}</button>
                    ))}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="btn btn-secondary btn-sm"
                >Next →</button>
              </motion.div>
            )}

            {/* Page info */}
            {rows.length > 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 16 }}>
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.totalUsers)} of {pagination.totalUsers} users
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
