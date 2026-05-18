import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const features = [
  {
    icon: '🧩',
    title: 'Solve Coding Challenges',
    desc: 'Tackle problems across algorithms, data structures, and system design from Easy to Hard.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Judging',
    desc: 'Submit your code and get instant verdicts — Accepted, Wrong Answer, TLE and more.',
  },
  {
    icon: '📊',
    title: 'Track Submissions',
    desc: 'Monitor every submission, review past attempts, and climb the leaderboard.',
  },
];

const stats = [
  { value: '10+', label: 'Problems' },
  { value: '4', label: 'Languages' },
  { value: 'Live', label: 'Judging' },
  { value: '∞', label: 'Attempts' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page" style={{ overflow: 'hidden' }}>
      {/* ── Hero ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        position: 'relative',
      }}>
        {/* Background orbs */}
        <div style={{
          position: 'absolute', top: '10%', left: '5%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />

        <div className="container" style={{ padding: '120px 24px 80px', textAlign: 'center' }}>
          <motion.div {...fadeUp(0.1)}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: 20, padding: '6px 16px',
              fontSize: '0.8rem', color: 'var(--accent-1)', fontWeight: 600,
              marginBottom: 28,
            }}>
              ⚡ Real-Time Code Judging Platform
            </span>
          </motion.div>

          <motion.h1 {...fadeUp(0.2)} style={{
            fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
            fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px',
            marginBottom: 24,
          }}>
            Practice.{' '}
            <span className="gradient-text">Compete.</span>
            <br />Improve.
          </motion.h1>

          <motion.p {...fadeUp(0.3)} style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            Sharpen your problem-solving skills with curated challenges, get instant
            feedback, and compete with developers worldwide.
          </motion.p>

          <motion.div {...fadeUp(0.4)} className="flex items-center" style={{ gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/problems" className="btn btn-primary btn-lg">
              🚀 Solve Problems
            </Link>
            <Link to="/leaderboard" className="btn btn-secondary btn-lg">
              🏆 Leaderboard
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div {...fadeUp(0.5)} style={{
            display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap',
            marginTop: 64,
          }}>
            {stats.map(({ value, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800 }} className="gradient-text">{value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '80px 0 120px' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <h2 className="section-title">Everything you need to <span className="gradient-text">level up</span></h2>
            <p className="section-sub">A complete competitive programming environment in your browser.</p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {features.map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                className="glass"
                initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6, boxShadow: 'var(--shadow-glow)' }}
                style={{ padding: 32 }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: 'var(--gradient)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem', marginBottom: 20,
                  boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
                }}>
                  {icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 10 }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ padding: '0 0 100px' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            style={{
              borderRadius: 24, padding: '60px 40px', textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))',
              border: '1px solid rgba(124,58,237,0.25)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>
              Ready to start coding?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '1rem' }}>
              Join thousands of developers practicing daily.
            </p>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get Started — It's Free
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
