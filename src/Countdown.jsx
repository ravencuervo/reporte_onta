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
    <div className="countdown-pill">
      <i className="bi bi-clock-fill countdown-icon" />
      <span className="countdown-label">Congreso en:</span>
      <span className="countdown-unit">{time.days}d</span>
      <span className="countdown-sep">:</span>
      <span className="countdown-unit">{pad(time.hours)}h</span>
      <span className="countdown-sep">:</span>
      <span className="countdown-unit">{pad(time.minutes)}m</span>
      <span className="countdown-sep">:</span>
      <span className="countdown-unit countdown-sec">{pad(time.seconds)}s</span>
    </div>
  );
}
