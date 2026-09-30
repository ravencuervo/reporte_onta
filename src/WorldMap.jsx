import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { useState } from 'react';

// world-atlas countries-110m.json usa ID numérico ISO 3166-1
const NUMERIC_ISO = {
  'PERU': '604',
  'BRASIL': '076',
  'COLOMBIA': '170',
  'CHILE': '152',
  'COSTA RICA': '188',
  'COREA DEL SUR': '410',
  'ESTADOS UNIDOS': '840',
  'ITALIA': '380',
  'CANADA': '124',
  'INDIA': '356',
  'NIGERIA': '566',
  'PARAGUAY': '600',
  'ECUADOR': '218',
  'MEXICO': '484',
  'CHINA': '156',
  'PAÍSES BAJOS': '528',
};

// Invertido: numérico → nombre
const ID_TO_COUNTRY = Object.fromEntries(
  Object.entries(NUMERIC_ISO).map(([name, id]) => [id, name])
);

const FLAGS = {
  'PERU': '🇵🇪', 'BRASIL': '🇧🇷', 'COLOMBIA': '🇨🇴', 'CHILE': '🇨🇱',
  'COSTA RICA': '🇨🇷', 'COREA DEL SUR': '🇰🇷', 'ESTADOS UNIDOS': '🇺🇸',
  'ITALIA': '🇮🇹', 'CANADA': '🇨🇦', 'INDIA': '🇮🇳', 'NIGERIA': '🇳🇬',
  'PARAGUAY': '🇵🇾', 'ECUADOR': '🇪🇨', 'MEXICO': '🇲🇽', 'CHINA': '🇨🇳',
  'PAÍSES BAJOS': '🇳🇱',
};

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

function getColor(count, max) {
  if (!count || count === 0) return '#f1f5f9';
  const ratio = count / max;
  if (ratio >= 0.7) return '#7f1d1d';
  if (ratio >= 0.4) return '#b91c1c';
  if (ratio >= 0.25) return '#ef4444';
  if (ratio >= 0.1) return '#fca5a5';
  return '#fee2e2';
}

export default function WorldMap({ countryCounts }) {
  const [tooltip, setTooltip] = useState(null);

  const maxCount = Math.max(...Object.values(countryCounts), 1);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Floating tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          background: '#1e293b', color: '#fff',
          padding: '0.4rem 1.1rem', borderRadius: 999,
          fontSize: '0.85rem', fontWeight: 700,
          pointerEvents: 'none', whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          zIndex: 10,
        }}>
          {tooltip}
        </div>
      )}

      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 170, center: [10, 10] }}
        style={{ width: '100%', height: '380px', display: 'block' }}
      >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // world-atlas usa id numérico como string
                const id = String(geo.id);
                const paddedId = id.padStart(3, '0');
                const countryName = ID_TO_COUNTRY[paddedId] || ID_TO_COUNTRY[id];
                const count = countryName ? (countryCounts[countryName] || 0) : 0;
                const hasData = count > 0;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getColor(count, maxCount)}
                    stroke="#ffffff"
                    strokeWidth={0.4}
                    style={{
                      default: { outline: 'none', transition: 'fill 0.15s ease' },
                      hover: {
                        fill: hasData ? '#991b1b' : '#e2e8f0',
                        outline: 'none',
                        cursor: hasData ? 'pointer' : 'default',
                      },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={() => {
                      if (countryName && count > 0) {
                        const flag = FLAGS[countryName] || '';
                        setTooltip(`${flag} ${countryName}: ${count} participante${count !== 1 ? 's' : ''}`);
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })
            }
          </Geographies>
      </ComposableMap>

      {/* Legend */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        justifyContent: 'center', marginTop: '0.5rem',
      }}>
        <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>Menos</span>
        {['#fee2e2', '#fca5a5', '#ef4444', '#b91c1c', '#7f1d1d'].map((c, i) => (
          <div key={i} style={{ width: 24, height: 10, background: c, borderRadius: 3 }} />
        ))}
        <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>Más</span>
      </div>

      {/* Country list pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1rem', justifyContent: 'center' }}>
        {Object.entries(countryCounts)
          .filter(([, v]) => v > 0)
          .sort((a, b) => b[1] - a[1])
          .map(([country, count]) => (
            <span key={country} style={{
              background: '#fef2f2', color: '#b91c1c',
              border: '1px solid #fecaca',
              padding: '0.2rem 0.65rem', borderRadius: 999,
              fontSize: '0.75rem', fontWeight: 700,
            }}>
              {FLAGS[country] || '🌍'} {country.charAt(0) + country.slice(1).toLowerCase()} · {count}
            </span>
          ))}
      </div>
    </div>
  );
}
