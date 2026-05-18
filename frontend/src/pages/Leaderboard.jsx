import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

function VerdictBadge({ verdict }) {
  const map = {
    'Accepted':            'verdict-ac',
    'Wrong Answer':        'verdict-wa',
    'Compilation Error':   'verdict-ce',
    'Runtime Error':       'verdict-re',
    'Time Limit Exceeded': 'verdict-tle',
  };
  return <span className={`verdict ${map[verdict] || ''}`}>{verdict}</span>;
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = () => {
    setLoading(true);
    api.get('/leaderboard')
      .then(({ data }) => setData(data.leaderboard))
      .catch(() => setError('Failed to load leaderboard.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeaderboard(); }, []);

  const langIcons = { cpp: '⚙️', python: '🐍', java: '☕', javascript: '🟨' };

  return (
    <div className="page" style={{ paddingTop: 'calc(var(--nav-h) + 40px)', paddingBottom: 80 }}>
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}
        >
          <div>
            <h1 className="section-title">🏆 Leader<span className="gradient-text">board</span></h1>
            <p className="section-sub">Latest 10 submissions across all users</p>
          </div>
          <button onClick={fetchLeaderboard} className="btn btn-secondary btn-sm">
            ↻ Refresh
          </button>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading submissions...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: 20, color: 'var(--hard)', textAlign: 'center',
          }}>{error}</div>
        )}

        {/* Table */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass" style={{ padding: 0, overflow: 'hidden' }}
          >
            {data.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                No submissions yet. Be the first to submit! 🚀
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User</th>
                      <th>Problem</th>
                      <th>Difficulty</th>
                      <th>Language</th>
                      <th>Verdict</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <motion.tr
                        key={row._id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <td>
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
                            color: i < 3 ? 'var(--accent-1)' : 'var(--text-muted)',
                            fontWeight: i < 3 ? 700 : 400,
                          }}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{row.username}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {row.userId?.substring(0, 8)}...
                          </div>
                        </td>
                        <td style={{ fontWeight: 500 }}>{row.problemName}</td>
                        <td>
                          {row.difficulty !== 'N/A' && (
                            <span className={`badge badge-${row.difficulty?.toLowerCase()}`}>{row.difficulty}</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem' }}>
                            {langIcons[row.language] || '📝'} {row.language}
                          </span>
                        </td>
                        <td><VerdictBadge verdict={row.verdict} /></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                          {timeAgo(row.submittedAt)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
