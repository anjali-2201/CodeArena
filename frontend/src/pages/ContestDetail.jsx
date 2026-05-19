import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const LANGUAGES = [
  { value: 'cpp', label: 'C++', monaco: 'cpp' },
  { value: 'python', label: 'Python', monaco: 'python' },
  { value: 'java', label: 'Java', monaco: 'java' },
  { value: 'javascript', label: 'JavaScript', monaco: 'javascript' },
];
const STARTERS = {
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    \n    return 0;\n}',
  python: 'def main():\n    pass\n\nmain()',
  java: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}',
  javascript: '// Write your solution here\n',
};

function ContestTimer({ endTime }) {
  const [ms, setMs] = useState(Math.max(0, new Date(endTime) - Date.now()));
  useEffect(() => {
    const t = setInterval(() => {
      const d = Math.max(0, new Date(endTime) - Date.now());
      setMs(d);
      if (d === 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [endTime]);

  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const isLow = ms < 300000; // < 5 min

  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontWeight: 800,
      fontSize: '1.1rem',
      color: isLow ? 'var(--hard)' : 'var(--accent-1)',
      padding: '6px 16px', borderRadius: 8,
      background: isLow ? 'rgba(239,68,68,0.1)' : 'rgba(124,58,237,0.1)',
      border: `1px solid ${isLow ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.3)'}`,
      animation: isLow ? 'pulse 1s ease infinite' : 'none',
    }}>
      ⏱ {pad(h)}:{pad(m)}:{pad(s)}
    </div>
  );
}

function VerdictBadge({ verdict }) {
  const m = {
    'Accepted': 'verdict-ac', 'Wrong Answer': 'verdict-wa',
    'Compilation Error': 'verdict-ce', 'Runtime Error': 'verdict-re',
    'Time Limit Exceeded': 'verdict-tle',
  };
  return <span className={`verdict ${m[verdict] || ''}`} style={{ fontSize: '0.78rem' }}>{verdict}</span>;
}

export default function ContestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [contest, setContest]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [activeProblem, setActive] = useState(0);
  const [language, setLanguage]   = useState('cpp');
  const [code, setCode]           = useState(STARTERS['cpp']);
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict]     = useState(null);
  const [mySubmissions, setMySubs] = useState([]);
  const [activeTab, setActiveTab] = useState('problem'); // 'problem' | 'leaderboard'

  useEffect(() => {
    api.get(`/contests/${id}`)
      .then(({ data }) => { setContest(data.contest); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!contest) return;
    const prob = contest.problems[activeProblem]?.problem;
    if (!prob) return;
    setSubmitting(true);
    setVerdict(null);
    try {
      const { data } = await api.post(`/contests/${id}/submit`, {
        problemId: prob._id || prob,
        language, code,
      });
      setVerdict(data.verdict);
      setMySubs((prev) => [{ verdict: data.verdict, language, time: new Date() }, ...prev].slice(0, 20));
    } catch (err) {
      setVerdict(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!contest) return <div className="page" style={{ paddingTop: 'calc(var(--nav-h) + 40px)', textAlign: 'center' }}>Contest not found.</div>;

  const now    = new Date();
  const status = contest.status;
  const prob   = contest.problems?.[activeProblem];

  return (
    <div className="page" style={{ paddingTop: 'var(--nav-h)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 24px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)', flexShrink: 0, gap: 12, flexWrap: 'wrap',
      }}>
        <div>
          <Link to="/contests" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none' }}>← Contests</Link>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginTop: 2 }}>{contest.title}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {status === 'ongoing' && <ContestTimer endTime={contest.endTime} />}
          {['problem', 'leaderboard'].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} className="btn btn-sm" style={{
              background: activeTab === t ? 'var(--gradient)' : 'var(--bg-card)',
              border:     activeTab === t ? 'none' : '1px solid var(--border)',
              color:      activeTab === t ? '#fff' : 'var(--text-secondary)',
              textTransform: 'capitalize',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {activeTab === 'leaderboard' ? (
        <ContestLeaderboard contestId={id} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', flex: 1, overflow: 'hidden' }}>
          {/* Problem list */}
          <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Problems ({contest.problems?.length || 0})
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {(contest.problems || []).map((p, i) => (
                <div key={i} onClick={() => setActive(i)} style={{
                  padding: '14px 16px', cursor: 'pointer',
                  background: activeProblem === i ? 'rgba(124,58,237,0.1)' : 'transparent',
                  borderLeft: activeProblem === i ? '3px solid var(--accent-1)' : '3px solid transparent',
                  borderBottom: '1px solid var(--border)',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    {String.fromCharCode(65 + i)}. {p.problem?.name || 'Problem'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    {p.points} pts · {p.problem?.difficulty}
                  </div>
                </div>
              ))}
            </div>

            {/* My submissions */}
            {mySubmissions.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', padding: 12, maxHeight: 160, overflowY: 'auto' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>My Submissions</div>
                {mySubmissions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, fontSize: '0.78rem' }}>
                    <VerdictBadge verdict={s.verdict} />
                    <span style={{ color: 'var(--text-muted)' }}>{new Date(s.time).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Editor area */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 16px', borderBottom: '1px solid var(--border)',
              background: 'var(--bg-secondary)', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {LANGUAGES.map(({ value, label }) => (
                  <button key={value} onClick={() => { setLanguage(value); setCode(STARTERS[value]); }}
                    className="btn btn-sm" style={{
                      background: language === value ? 'var(--gradient)' : 'var(--bg-card)',
                      border:     language === value ? 'none' : '1px solid var(--border)',
                      color:      language === value ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.78rem', padding: '5px 12px',
                    }}>{label}</button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {verdict && <VerdictBadge verdict={verdict} />}
                <button onClick={handleSubmit} disabled={submitting || status !== 'ongoing' || !user}
                  className="btn btn-primary btn-sm" style={{ fontSize: '0.82rem' }}>
                  {submitting ? '⏳ Judging...' : '🚀 Submit'}
                </button>
              </div>
            </div>

            {/* Problem statement */}
            {prob && (
              <div style={{ padding: '16px 24px', maxHeight: '35%', overflowY: 'auto', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{String.fromCharCode(65 + activeProblem)}. {prob.problem?.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7 }}>
                  {prob.problem?.statement || 'Problem statement hidden until contest starts.'}
                </p>
              </div>
            )}

            {/* Monaco */}
            <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
              <Editor height="100%" language={LANGUAGES.find((l) => l.value === language)?.monaco}
                value={code} onChange={(v) => setCode(v || '')} theme="vs-dark"
                options={{ fontSize: 14, minimap: { enabled: false }, padding: { top: 12 }, scrollBeyondLastLine: false }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContestLeaderboard({ contestId }) {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get(`/contests/${contestId}/leaderboard`)
      .then(({ data }) => setRows(data.leaderboard))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [contestId]);

  const MEDALS = ['🥇', '🥈', '🥉'];

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  return (
    <div style={{ overflowY: 'auto', flex: 1, padding: '24px 32px' }}>
      <h2 style={{ marginBottom: 20, fontWeight: 700 }}>Contest Leaderboard</h2>
      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No submissions yet. Be first!</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              style={{
                display: 'grid', gridTemplateColumns: '48px 1fr 100px 120px',
                alignItems: 'center', gap: 12,
                padding: '12px 20px', borderRadius: 10,
                background: r.fullName === user?.fullName ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${r.fullName === user?.fullName ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
              }}>
              <div style={{ textAlign: 'center', fontSize: r.rank <= 3 ? '1.3rem' : '0.85rem', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {r.rank <= 3 ? MEDALS[r.rank - 1] : `#${r.rank}`}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{r.fullName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.problemsSolved} solved</div>
              </div>
              <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                +{r.totalPenalty}min
              </div>
              <div style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-1)' }}>
                {r.problemsSolved * 100 - r.totalPenalty} pts
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
