import React from 'react';

const ActivityLog = ({ entries }) => {
  if (entries.length === 0) return null;

  const formatTime = (date) =>
    date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const getScoreColor = (score) => {
    if (score >= 70) return 'var(--accent-green)';
    if (score >= 40) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
          Sentry Activity Log
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Last {entries.length} events
        </div>
      </div>

      <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
        {entries.map((entry) => (
          <div
            key={entry.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 20px',
              borderBottom: '1px solid var(--border)',
              background: entry.changed ? 'rgba(139, 92, 246, 0.04)' : 'transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {entry.logoURI ? (
                <img
                  src={entry.logoURI}
                  alt={entry.symbol}
                  style={{ width: '22px', height: '22px', borderRadius: '50%' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'var(--bg-card-hover)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                }}>
                  {entry.symbol?.charAt(0)}
                </div>
              )}
              <div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {entry.symbol}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                  {entry.recommendation}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {entry.prevScore !== null && entry.changed && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ color: getScoreColor(entry.prevScore) }}>
                    {entry.prevScore}
                  </span>
                  {' -> '}
                  <span style={{ color: getScoreColor(entry.newScore) }}>
                    {entry.newScore}
                  </span>
                </div>
              )}
              {!entry.changed && (
                <div style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: getScoreColor(entry.newScore),
                }}>
                  {entry.newScore}
                </div>
              )}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '60px', textAlign: 'right' }}>
                {formatTime(entry.time)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;