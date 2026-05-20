import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import api from '../services/api';

const LANGUAGES = [
  { value: 'cpp',        label: 'C++',        monaco: 'cpp' },
  { value: 'python',     label: 'Python',     monaco: 'python' },
  { value: 'java',       label: 'Java',       monaco: 'java' },
  { value: 'javascript', label: 'JavaScript', monaco: 'javascript' },
];

const STARTERS = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Write your solution here
    
    return 0;
}`,
  python: `import sys
input = sys.stdin.readline

def main():
    # Write your solution here
    pass

main()`,
  java: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
    }
}`,
  javascript: `// Input is available via three equivalent patterns — pick whichever you prefer:
//
//   Pattern 1: readline()  — pop one line at a time (most common in CP)
//     const n = parseInt(readline());
//     const arr = readline().split(' ').map(Number);
//
//   Pattern 2: lines[]  — indexed access to all lines at once
//     const n = parseInt(lines[0]);
//     const arr = lines[1].split(' ').map(Number);
//
//   Pattern 3: input  — the full stdin string
//     const [a, b] = input.trim().split('\\n').map(Number);
//
// All three variables are pre-loaded from stdin automatically.

const n = parseInt(readline());
console.log(n);
`,
};

const VERDICT_MAP = {
  'Accepted':            'verdict-ac',
  'Wrong Answer':        'verdict-wa',
  'Compilation Error':   'verdict-ce',
  'Runtime Error':       'verdict-re',
  'Time Limit Exceeded': 'verdict-tle',
};

function DifficultyBadge({ level }) {
  const cls = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' }[level] || '';
  return <span className={`badge ${cls}`}>{level}</span>;
}

/* ── Submit Verdict Panel ── */
function SubmitPanel({ verdict, message, submitting, submissions }) {
  if (submitting) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', padding: '12px 0' }}>
      <div className="spinner" style={{ width: 20, height: 20 }} /> Judging against hidden test cases...
    </div>
  );
  if (!verdict && submissions.length === 0) return (
    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Submit your solution to see the verdict.</p>
  );

  const verdictIcons = {
    'Accepted': '✅', 'Wrong Answer': '❌', 'Compilation Error': '🔧',
    'Runtime Error': '💥', 'Time Limit Exceeded': '⏰',
  };

  return (
    <div>
      {verdict && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className={`verdict ${VERDICT_MAP[verdict] || ''}`} style={{ marginBottom: 8, fontSize: '0.95rem' }}>
            {verdictIcons[verdict] || '❓'} {verdict}
          </div>
          {message && message !== verdict && (
            <pre style={{
              background: 'var(--bg-primary)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 14px',
              fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
              color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              maxHeight: 120, overflowY: 'auto',
            }}>{message}</pre>
          )}
        </motion.div>
      )}

      {submissions.length > 0 && (
        <div style={{ marginTop: verdict ? 14 : 0 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Recent
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {submissions.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem' }}>
                <span className={`verdict ${VERDICT_MAP[s.verdict] || ''}`} style={{ padding: '2px 8px', fontSize: '0.73rem' }}>{s.verdict}</span>
                <span style={{ color: 'var(--text-muted)' }}>{new Date(s.submitted_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Run Results Panel ── */
function RunPanel({ results, running }) {
  if (running) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', padding: '12px 0' }}>
      <div className="spinner" style={{ width: 20, height: 20 }} /> Running against sample test cases...
    </div>
  );
  if (!results) return (
    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Click Run to test against sample inputs.</p>
  );

  const allPassed = results.every((r) => r.passed);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      {/* Summary banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
        padding: '8px 14px', borderRadius: 8,
        background: allPassed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${allPassed ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
      }}>
        <span style={{ fontSize: '1.1rem' }}>{allPassed ? '✅' : '❌'}</span>
        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: allPassed ? 'var(--easy)' : 'var(--hard)' }}>
          {allPassed
            ? `All ${results.length} sample test${results.length > 1 ? 's' : ''} passed!`
            : `${results.filter((r) => r.passed).length}/${results.length} test${results.length > 1 ? 's' : ''} passed`}
        </span>
      </div>

      {/* Per-case breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {results.map((r) => (
          <div key={r.index} style={{
            borderRadius: 10, border: `1px solid ${r.passed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            background: r.passed ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)',
            overflow: 'hidden',
          }}>
            {/* Case header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px',
              borderBottom: `1px solid ${r.passed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
            }}>
              <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>Test Case {r.index}</span>
              <span style={{
                fontSize: '0.72rem', fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                background: r.passed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                color: r.passed ? 'var(--easy)' : 'var(--hard)',
              }}>
                {r.passed ? '✓ Passed' : r.verdict}
              </span>
            </div>

            {/* Input / Expected / Got */}
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Input',           value: r.input,          color: 'var(--text-secondary)' },
                { label: 'Expected Output', value: r.expectedOutput, color: 'var(--easy)' },
                { label: 'Your Output',     value: r.actualOutput,   color: r.passed ? 'var(--easy)' : 'var(--hard)' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>
                    {label}
                  </div>
                  <pre style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color,
                    background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '6px 10px',
                    margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    maxHeight: 80, overflowY: 'auto',
                  }}>{value || '(empty)'}</pre>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Main Component ── */
export default function ProblemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [language, setLanguage]     = useState('cpp');
  const [code, setCode]             = useState(STARTERS['cpp']);
  const [activeTab, setActiveTab]   = useState('submit'); // 'submit' | 'run'
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning]       = useState(false);
  const [verdict, setVerdict]       = useState(null);
  const [verdictMsg, setVerdictMsg] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [runResults, setRunResults] = useState(null);

  useEffect(() => {
    api.get(`/problems/${id}`)
      .then(({ data }) => setProblem(data.problem))
      .catch(() => navigate('/problems'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLangChange = (lang) => {
    setLanguage(lang);
    setCode(STARTERS[lang]);
    setVerdict(null);
    setRunResults(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setActiveTab('submit');
    setVerdict(null);
    setVerdictMsg('');
    try {
      const { data } = await api.post('/submissions', { problemId: id, language, code });
      setVerdict(data.verdict);
      setVerdictMsg(data.message);
      setSubmissions((prev) => [data.submission, ...prev].slice(0, 8));
    } catch (err) {
      setVerdict('Runtime Error');
      setVerdictMsg(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setActiveTab('run');
    setRunResults(null);
    try {
      const { data } = await api.post('/submissions/run', { problemId: id, language, code });
      setRunResults(data.results);
    } catch (err) {
      setRunResults([{
        index: 1, input: '', expectedOutput: '',
        actualOutput: err.response?.data?.message || 'Run failed.',
        verdict: 'Runtime Error', passed: false,
      }]);
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page" style={{ paddingTop: 'var(--nav-h)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '420px 1fr',
        flex: 1, overflow: 'hidden', borderTop: '1px solid var(--border)',
      }}>
        {/* ── LEFT: Problem Statement ── */}
        <div style={{ overflowY: 'auto', padding: '24px 28px', borderRight: '1px solid var(--border)' }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <DifficultyBadge level={problem?.difficulty} />
            </div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1.3 }}>{problem?.name}</h1>
          </div>

          <div className="divider" />

          {/* Statement */}
          <div style={{ marginBottom: 22 }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Problem Statement
            </h3>
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.875rem', whiteSpace: 'pre-line' }}>
              {problem?.statement}
            </div>
          </div>

          {/* Examples */}
          {problem?.examples?.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Examples
              </h3>
              {problem.examples.map((ex, i) => (
                <div key={i} style={{
                  background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '12px 16px',
                  marginBottom: 10, border: '1px solid var(--border)',
                }}>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>INPUT</span>
                    <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)', marginTop: 3 }}>{ex.input}</pre>
                  </div>
                  <div style={{ marginBottom: ex.explanation ? 6 : 0 }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>OUTPUT</span>
                    <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--easy)', marginTop: 3 }}>{ex.output}</pre>
                  </div>
                  {ex.explanation && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                      💡 {ex.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Constraints */}
          {problem?.constraints?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                Constraints
              </h3>
              <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {problem.constraints.map((c, i) => (
                  <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── RIGHT: Editor + Bottom Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 16px', borderBottom: '1px solid var(--border)',
            background: 'var(--bg-secondary)', flexShrink: 0, gap: 10,
          }}>
            {/* Language selector */}
            <div style={{ display: 'flex', gap: 5 }}>
              {LANGUAGES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleLangChange(value)}
                  className="btn btn-sm"
                  style={{
                    background: language === value ? 'var(--gradient)' : 'var(--bg-card)',
                    border: language === value ? 'none' : '1px solid var(--border)',
                    color: language === value ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.78rem', padding: '5px 12px',
                  }}
                >{label}</button>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                id="run-btn"
                onClick={handleRun}
                disabled={running || submitting}
                className="btn btn-sm"
                style={{
                  background: 'rgba(6,182,212,0.15)',
                  border: '1px solid rgba(6,182,212,0.3)',
                  color: '#22d3ee',
                  fontSize: '0.82rem',
                }}
              >
                {running ? '⏳ Running...' : '▶ Run'}
              </button>
              <button
                id="submit-btn"
                onClick={handleSubmit}
                disabled={submitting || running}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.82rem' }}
              >
                {submitting ? '⏳ Judging...' : '🚀 Submit'}
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <Editor
              height="100%"
              language={LANGUAGES.find((l) => l.value === language)?.monaco}
              value={code}
              onChange={(val) => setCode(val || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                padding: { top: 14, bottom: 14 },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                tabSize: 4,
              }}
            />
          </div>

          {/* ── Bottom Panel ── */}
          <div style={{
            flexShrink: 0, borderTop: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            maxHeight: 300, display: 'flex', flexDirection: 'column',
          }}>
            {/* Tab bar */}
            <div style={{
              display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              {[
                { key: 'run',    label: '▶ Test Results' },
                { key: 'submit', label: '🚀 Submission' },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setActiveTab(key)} style={{
                  padding: '9px 18px', background: 'none', border: 'none',
                  borderBottom: activeTab === key ? '2px solid var(--accent-1)' : '2px solid transparent',
                  color: activeTab === key ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: activeTab === key ? 600 : 400,
                  fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s',
                }}>{label}</button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: '14px 20px', overflowY: 'auto', flex: 1 }}>
              <AnimatePresence mode="wait">
                {activeTab === 'run' ? (
                  <motion.div key="run" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <RunPanel results={runResults} running={running} />
                  </motion.div>
                ) : (
                  <motion.div key="submit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <SubmitPanel verdict={verdict} message={verdictMsg} submitting={submitting} submissions={submissions} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
