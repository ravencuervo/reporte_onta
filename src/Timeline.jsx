import { useMemo } from 'react';

export default function Timeline({ usuarios, pagos }) {
  const events = useMemo(() => {
    const pagosMap = {};
    pagos.forEach(p => {
      const key = (p['Nombre Completo'] || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      pagosMap[key] = p;
    });

    const all = usuarios.map(u => {
      const regDate = parseDate(u['Fecha Registro']);
      const nombreKey = (u['Nombre'] || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      let pago = pagosMap[nombreKey];
      if (!pago) {
        const found = Object.keys(pagosMap).find(k =>
          k.includes(nombreKey.split(' ')[0]) && k.includes(nombreKey.split(' ').slice(-1)[0])
        );
        if (found) pago = pagosMap[found];
      }
      const pagoDate = pago ? parseDate(pago['Fecha Registro']) : null;
      const daysToPayment = pagoDate && regDate ? Math.round((pagoDate - regDate) / (1000 * 60 * 60 * 24)) : null;
      return {
        nombre: u['Nombre'],
        institucion: u['Institución'],
        nac: u['NACIONALIDAD'],
        regDate,
        pagoDate,
        monto: pago ? parseFloat(pago['Monto ($)']) : null,
        metodo: pago ? pago['Método Pago'] : null,
        daysToPayment,
        pagado: !!pago,
      };
    }).sort((a, b) => (b.regDate || 0) - (a.regDate || 0));

    return all;
  }, [usuarios, pagos]);

  const formatDate = (d) => {
    if (!d) return '—';
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ position: 'relative', padding: '0.5rem 0 0.5rem 2rem' }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute', left: '1rem', top: 0, bottom: 0,
        width: 2, background: 'linear-gradient(to bottom, #dc2626, #fecaca)',
        borderRadius: 2,
      }} />

      {events.map((ev, i) => (
        <div key={i} style={{
          position: 'relative', marginBottom: '1rem',
          background: '#fff', border: `1px solid ${ev.pagado ? '#dcfce7' : '#fee2e2'}`,
          borderRadius: 12, padding: '0.85rem 1rem',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          transition: 'box-shadow 0.2s, transform 0.2s',
          cursor: 'default',
        }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(220,38,38,0.1)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateX(0)'; }}
        >
          {/* Dot on the line */}
          <div style={{
            position: 'absolute', left: -26, top: '50%', transform: 'translateY(-50%)',
            width: 12, height: 12, borderRadius: '50%',
            background: ev.pagado ? '#16a34a' : '#d97706',
            border: '2px solid #fff',
            boxShadow: `0 0 0 2px ${ev.pagado ? '#bbf7d0' : '#fde68a'}`,
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>{ev.nombre}</div>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 }}>{ev.institucion}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                background: ev.nac === 'NACIONAL' ? '#dbeafe' : '#fef3c7',
                color: ev.nac === 'NACIONAL' ? '#2563eb' : '#d97706',
                padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
                border: `1px solid ${ev.nac === 'NACIONAL' ? '#bfdbfe' : '#fde68a'}`,
              }}>
                {ev.nac === 'NACIONAL' ? '🇵🇪 Nacional' : '✈️ Extranjero'}
              </span>
              {ev.pagado ? (
                <span style={{
                  background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.7rem',
                  borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, border: '1px solid #bbf7d0',
                }}>
                  <i className="bi bi-check-circle-fill" style={{ marginRight: 4 }} />
                  ${ev.monto} · {ev.metodo}
                </span>
              ) : (
                <span style={{
                  background: '#fef3c7', color: '#d97706', padding: '0.2rem 0.7rem',
                  borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, border: '1px solid #fde68a',
                }}>
                  <i className="bi bi-clock-fill" style={{ marginRight: 4 }} />
                  Sin pago
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.78rem', color: '#9ca3af' }}>
            <span><i className="bi bi-person-plus-fill" style={{ marginRight: 3, color: '#dc2626' }} />Inscripción: {formatDate(ev.regDate)}</span>
            {ev.pagoDate && <span><i className="bi bi-credit-card-fill" style={{ marginRight: 3, color: '#16a34a' }} />Pago: {formatDate(ev.pagoDate)}</span>}
            {ev.daysToPayment !== null && (
              <span><i className="bi bi-hourglass-split" style={{ marginRight: 3, color: '#d97706' }} />{ev.daysToPayment === 0 ? 'Mismo día' : `${ev.daysToPayment} días después`}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function parseDate(str) {
  if (!str) return null;
  const [datePart, timePart] = str.split(' ');
  const [d, m, y] = datePart.split('/');
  return new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T${timePart || '00:00'}`);
}
