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
  javascript: `const lines = input.split('\\n');
let idx = 0;

// Write your solution here
// Use readline() to read lines, console.log() to output
`,
};

function DifficultyBadge({ level }) {
  const cls = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' }[level] || '';
  return <span className={`badge ${cls}`}>{level}</span>;
}

function VerdictPanel({ verdict, message, submitting }) {
  if (submitting) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', padding: '16px 0' }}>
      <div className="spinner" style={{ width: 20, height: 20 }} /> Running test cases...
    </div>
  );
  if (!verdict) return null;

  const map = {
    'Accepted':            { cls: 'verdict-ac',  icon: '✅' },
    'Wrong Answer':        { cls: 'verdict-wa',  icon: '❌' },
    'Compilation Error':   { cls: 'verdict-ce',  icon: '🔧' },
    'Runtime Error':       { cls: 'verdict-re',  icon: '💥' },
    'Time Limit Exceeded': { cls: 'verdict-tle', icon: '⏰' },
  };
  const { cls, icon } = map[verdict] || { cls: '', icon: '❓' };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ paddingTop: 16 }}>
      <div className={`verdict ${cls}`} style={{ marginBottom: 8, fontSize: '0.95rem' }}>
        {icon} {verdict}
      </div>
      {message && message !== verdict && (
        <pre style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '12px 16px',
          fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
          color: 'var(--text-secondary)', overflowX: 'auto',
          whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          maxHeight: 200, overflowY: 'auto',
        }}>{message}</pre>
      )}
    </motion.div>
  );
}

export default function ProblemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(STARTERS['cpp']);
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [verdictMsg, setVerdictMsg] = useState('');
  const [submissions, setSubmissions] = useState([]);

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
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setVerdict(null);
    setVerdictMsg('');
    try {
      const { data } = await api.post('/submissions', { problemId: id, language, code });
      setVerdict(data.verdict);
      setVerdictMsg(data.message);
      setSubmissions((prev) => [data.submission, ...prev].slice(0, 10));
    } catch (err) {
      setVerdict('Runtime Error');
      setVerdictMsg(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="loading-screen"><div className="spinner" /></div>
  );

  const verdictMap = {
    'Accepted': 'verdict-ac', 'Wrong Answer': 'verdict-wa',
    'Compilation Error': 'verdict-ce', 'Runtime Error': 'verdict-re',
    'Time Limit Exceeded': 'verdict-tle',
  };

  return (
    <div className="page" style={{ paddingTop: 'var(--nav-h)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '420px 1fr',
        gap: 0, flex: 1, overflow: 'hidden',
        borderTop: '1px solid var(--border)',
      }}>
        {/* ── LEFT: Problem info ── */}
        <div style={{
          overflowY: 'auto', padding: '28px 28px',
          borderRight: '1px solid var(--border)',
        }}>
          {/* Title + badge */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <DifficultyBadge level={problem?.difficulty} />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.3 }}>{problem?.name}</h1>
          </div>

          <div className="divider" />

          {/* Statement */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
              Problem Statement
            </h3>
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
              {problem?.statement}
            </div>
          </div>

          {/* Examples */}
          {problem?.examples?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                Examples
              </h3>
              {problem.examples.map((ex, i) => (
                <div key={i} style={{
                  background: 'var(--bg-secondary)', borderRadius: 8,
                  padding: '14px 16px', marginBottom: 12,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>INPUT</span>
                    <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-primary)', marginTop: 4 }}>{ex.input}</pre>
                  </div>
                  <div style={{ marginBottom: ex.explanation ? 8 : 0 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OUTPUT</span>
                    <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--easy)', marginTop: 4 }}>{ex.output}</pre>
                  </div>
                  {ex.explanation && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
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
              <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                Constraints
              </h3>
              <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {problem.constraints.map((c, i) => (
                  <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── RIGHT: Editor + verdict ── */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 20px', borderBottom: '1px solid var(--border)',
            background: 'var(--bg-secondary)', flexShrink: 0,
          }}>
            {/* Language selector */}
            <div style={{ display: 'flex', gap: 6 }}>
              {LANGUAGES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleLangChange(value)}
                  className="btn btn-sm"
                  style={{
                    background: language === value ? 'var(--gradient)' : 'var(--bg-card)',
                    border: language === value ? 'none' : '1px solid var(--border)',
                    color: language === value ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Submit button */}
            <button
              id="submit-btn"
              onClick={handleSubmit}
              disabled={submitting}
              className="btn btn-primary btn-sm"
            >
              {submitting ? '⏳ Judging...' : '🚀 Submit'}
            </button>
          </div>

          {/* Monaco Editor */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
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
                padding: { top: 16, bottom: 16 },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                tabSize: 4,
              }}
            />
          </div>

          {/* Verdict panel */}
          <div style={{
            flexShrink: 0, padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            minHeight: 80, maxHeight: 280, overflowY: 'auto',
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Verdict
            </div>
            <VerdictPanel verdict={verdict} message={verdictMsg} submitting={submitting} />

            {/* Submission history */}
            {submissions.length > 0 && !submitting && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>
                  Recent Submissions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {submissions.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem' }}>
                      <span className={`verdict ${verdictMap[s.verdict] || ''}`} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                        {s.verdict}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {new Date(s.submitted_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
