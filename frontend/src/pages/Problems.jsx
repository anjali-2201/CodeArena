import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

function DifficultyBadge({ level }) {
  const cls = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' }[level] || '';
  return <span className={`badge ${cls}`}>{level}</span>;
}

export default function Problems() {
  const [problems, setProblems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/problems')
      .then(({ data }) => { setProblems(data.problems); setFiltered(data.problems); })
      .catch(() => setError('Failed to load problems.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let list = [...problems];
    if (difficulty !== 'All') list = list.filter((p) => p.difficulty === difficulty);
    if (search.trim()) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(list);
  }, [search, difficulty, problems]);

  return (
    <div className="page" style={{ paddingTop: 'calc(var(--nav-h) + 40px)', paddingBottom: 80 }}>
      <div className="container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="section-title">Problem <span className="gradient-text">Set</span></h1>
          <p className="section-sub" style={{ marginBottom: 32 }}>
            {problems.length} problems • Pick a challenge and start coding
          </p>
        </motion.div>

        {/* Search + Filter */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}
        >
          {/* Search */}
          <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              id="problem-search"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Difficulty filters */}
          <div className="flex items-center gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className="btn btn-sm"
                style={{
                  background: difficulty === d ? 'var(--gradient)' : 'var(--bg-card)',
                  border: difficulty === d ? 'none' : '1px solid var(--border)',
                  color: difficulty === d ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            Loading problems...
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: 20, color: 'var(--hard)', textAlign: 'center',
          }}>{error}</div>
        )}

        {/* Problem Grid */}
        {!loading && !error && (
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}
              >
                😕 No problems match your filters.
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filtered.map((problem, i) => (
                  <motion.div
                    key={problem._id}
                    layout
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="glass"
                    whileHover={{ x: 4, borderColor: 'var(--border-hover)' }}
                    style={{ padding: '18px 24px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                        <span style={{
                          width: 36, height: 36, borderRadius: 8, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          background: 'var(--bg-secondary)', color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600,
                          flexShrink: 0,
                        }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>
                            {problem.name}
                          </div>
                          <DifficultyBadge level={problem.difficulty} />
                        </div>
                      </div>
                      <Link to={`/problems/${problem._id}`} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                        Solve →
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
