export default function AbstractModal({ abstract, onClose }) {
  if (!abstract) return null;

  const keywords = (abstract['Keywords'] || '').split(/[;,]/).map(k => k.trim()).filter(Boolean);

  return (
    <div
      className="abstract-modal-overlay"
      onClick={onClose}
    >
      <div
        className="abstract-modal-container"
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }`}</style>

        {/* Close button */}
        <button
          className="abstract-modal-close"
          onClick={onClose}
          aria-label="Cerrar modal"
        >
          <i className="bi bi-x-lg" />
        </button>

        {/* Modal header badge */}
        <div style={{ marginBottom: '1rem' }}>
          <span style={{
            background: abstract['MODALIDAD'] === 'ORAL' ? '#fef2f2' : '#dbeafe',
            color: abstract['MODALIDAD'] === 'ORAL' ? '#dc2626' : '#2563eb',
            padding: '0.3rem 0.9rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 800,
            border: `1px solid ${abstract['MODALIDAD'] === 'ORAL' ? '#fecaca' : '#bfdbfe'}`,
            marginRight: '0.5rem',
          }}>
            <i className={`bi ${abstract['MODALIDAD'] === 'ORAL' ? 'bi-mic-fill' : 'bi-image-fill'}`} style={{ marginRight: 4 }} />
            {abstract['MODALIDAD']}
          </span>
          <span style={{
            background: '#fef3c7', color: '#d97706', padding: '0.3rem 0.9rem',
            borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, border: '1px solid #fde68a',
          }}>
            <i className="bi bi-tag-fill" style={{ marginRight: 4 }} />
            {abstract['Línea']}
          </span>
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '1.15rem', fontWeight: 800, color: '#111827',
          lineHeight: 1.4, marginBottom: '1.25rem', paddingRight: '2rem',
          fontFamily: 'Outfit, sans-serif'
        }}>
          {abstract['Título']}
        </h2>

        {/* Info grid */}
        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <InfoRow icon="bi-people-fill" label="Autores" value={abstract['Autores']} />
          <InfoRow icon="bi-building" label="Afiliación" value={abstract['Afiliación']} />
          <InfoRow icon="bi-calendar3" label="Fecha de Envío" value={abstract['Fecha Envío']?.split(' ')[0]} />
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.5rem' }}>
              <i className="bi bi-tags-fill" style={{ marginRight: 4 }} />Palabras Clave
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {keywords.map((kw, i) => (
                <span key={i} style={{
                  background: '#f9fafb', border: '1px solid #e5e7eb',
                  padding: '0.25rem 0.7rem', borderRadius: 999,
                  fontSize: '0.78rem', fontWeight: 600, color: '#374151',
                }}>
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <div style={{
        width: 32, height: 32, background: '#fef2f2', borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#dc2626', flexShrink: 0, fontSize: '0.9rem',
      }}>
        <i className={`bi ${icon}`} />
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
        <div style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.45, fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}
