import { useEffect, useState } from 'react';

const TARGET_DATE = new Date('2026-11-09T08:00:00-05:00');

function pad(n) { return String(n).padStart(2, '0'); }

export default function Countdown() {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = TARGET_DATE - now;
      if (diff <= 0) {
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTime({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      background: '#fef2f2', border: '1px solid #fecaca',
      padding: '0.35rem 1rem', borderRadius: 999,
      fontSize: '0.82rem', fontWeight: 700, color: '#b91c1c',
    }}>
      <i className="bi bi-clock-fill" style={{ color: '#ef4444', fontSize: '0.8rem' }} />
      <span style={{ color: '#6b7280', fontWeight: 500 }}>Congreso en:</span>
      <span style={{ color: '#dc2626' }}>{time.days}d</span>
      <span style={{ color: '#9ca3af' }}>:</span>
      <span style={{ color: '#dc2626' }}>{pad(time.hours)}h</span>
      <span style={{ color: '#9ca3af' }}>:</span>
      <span style={{ color: '#dc2626' }}>{pad(time.minutes)}m</span>
      <span style={{ color: '#9ca3af' }}>:</span>
      <span style={{ color: '#dc2626', fontFamily: 'monospace', fontSize: '0.9rem' }}>{pad(time.seconds)}s</span>
    </div>
  );
}
