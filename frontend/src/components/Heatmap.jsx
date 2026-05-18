import React, { useMemo } from 'react';

/**
 * GitHub-style contribution heatmap
 * activity: { "YYYY-MM-DD": { count, accepted } }
 */
export default function Heatmap({ activity = {} }) {
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from 52 weeks ago, on a Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek);

    const weeks = [];
    const monthLabels = [];
    let current = new Date(start);
    let lastMonth = -1;

    while (current <= today) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2,'0')}-${String(current.getDate()).padStart(2,'0')}`;
        const data = activity[key] || { count: 0, accepted: 0 };
        const isFuture = current > today;
        week.push({
          date: new Date(current),
          key,
          count: isFuture ? -1 : data.count,
          accepted: data.accepted,
        });

        // Track month label position
        if (!isFuture && current.getMonth() !== lastMonth) {
          monthLabels.push({
            month: current.toLocaleString('default', { month: 'short' }),
            weekIndex: weeks.length,
          });
          lastMonth = current.getMonth();
        }
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }

    return { weeks, monthLabels };
  }, [activity]);

  const getColor = (count) => {
    if (count < 0)  return 'transparent'; // future
    if (count === 0) return 'rgba(255,255,255,0.04)';
    if (count === 1) return 'rgba(124,58,237,0.3)';
    if (count === 2) return 'rgba(124,58,237,0.5)';
    if (count <= 4)  return 'rgba(124,58,237,0.7)';
    return 'rgba(124,58,237,0.95)';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const totalSubmissions = Object.values(activity).reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 4, position: 'relative', minWidth: 'max-content' }}>
          {/* Day labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 20 }}>
            {dayLabels.map((d, i) => (
              <div key={d} style={{
                height: 11, fontSize: '0.6rem', color: 'var(--text-muted)',
                lineHeight: '11px', width: 24, textAlign: 'right', paddingRight: 4,
                visibility: i % 2 === 1 ? 'visible' : 'hidden',
              }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div>
            {/* Month labels */}
            <div style={{ display: 'flex', gap: 3, height: 16, marginBottom: 4 }}>
              {weeks.map((_, wi) => {
                const label = monthLabels.find((m) => m.weekIndex === wi);
                return (
                  <div key={wi} style={{ width: 11, fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {label ? label.month : ''}
                  </div>
                );
              })}
            </div>

            {/* Cells */}
            <div style={{ display: 'flex', gap: 3 }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {week.map((day) => (
                    <div
                      key={day.key}
                      title={day.count >= 0 ? `${day.date.toDateString()}: ${day.count} submission${day.count !== 1 ? 's' : ''}` : ''}
                      style={{
                        width: 11, height: 11,
                        borderRadius: 2,
                        background: getColor(day.count),
                        border: day.count > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        cursor: day.count > 0 ? 'pointer' : 'default',
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={e => { if (day.count > 0) e.target.style.transform = 'scale(1.4)'; }}
                      onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {totalSubmissions} submissions in the last year
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Less</span>
          {[0, 1, 2, 3, 4, 5].map((v) => (
            <div key={v} style={{ width: 10, height: 10, borderRadius: 2, background: getColor(v) }} />
          ))}
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>More</span>
        </div>
      </div>
    </div>
  );
}
