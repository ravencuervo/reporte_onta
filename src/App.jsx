import { useEffect, useState, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend, LineElement, PointElement, Filler
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import WorldMap from './WorldMap';
import Countdown from './Countdown';
import AbstractModal from './AbstractModal';
import TimelineView from './Timeline';
import { exportFullPDF } from './exportPDF';
import './index.css';

function useCountUp(end, duration = 1200) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    let start = null;
    const from = 0;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(from + (end - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [end, duration]);
  return val;
}

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend, LineElement, PointElement, Filler,
  ChartDataLabels
);

// ─── Color helpers ─────────────────────────────────────────────────────────────
const RED_PALETTE = ['#dc2626','#ef4444','#f87171','#fca5a5','#fecaca','#fee2e2'];
const MULTI_PALETTE = ['#dc2626','#d97706','#2563eb','#16a34a','#9333ea','#0891b2','#db2777','#65a30d'];

const COUNTRY_FLAGS = {
  'PERU': '🇵🇪', 'BRASIL': '🇧🇷', 'COLOMBIA': '🇨🇴', 'CHILE': '🇨🇱',
  'COSTA RICA': '🇨🇷', 'COREA DEL SUR': '🇰🇷', 'ESTADOS UNIDOS': '🇺🇸',
  'ITALIA': '🇮🇹', 'CANADA': '🇨🇦', 'INDIA': '🇮🇳', 'NIGERIA': '🇳🇬',
  'PARAGUAY': '🇵🇾', 'ECUADOR': '🇪🇨', 'MEXICO': '🇲🇽', 'CHINA': '🇨🇳',
  'PAÍSES BAJOS': '🇳🇱', 'OTRO': '🌍'
};

// Detect country from institution/department info
function detectCountry(user) {
  const dept = (user['Departamento'] || '').toUpperCase();
  const inst = (user['Institución'] || '').toUpperCase();
  const combined = `${dept} ${inst}`;
  if (combined.includes('PERU') || combined.includes('PUNO') || combined.includes('LIMA') || combined.includes('TRUJILLO') || combined.includes('ICA') || combined.includes('AREQUIPA') || combined.includes('HUÁNUCO') || combined.includes('CUSCO') || combined.includes('LAMBAYEQUE') || combined.includes('CHICLAYO') || combined.includes('AMAZONAS') || combined.includes('QUILLABAMBA') || combined.includes('LA LIBERTAD') || combined.includes('LAMOLINA') || combined.includes('UNALM') || combined.includes('UNITRU')) return 'PERU';
  if (combined.includes('BRASIL') || combined.includes('BRAZIL') || combined.includes('GOIÂNIA') || combined.includes('MARINGÁ') || combined.includes('VIÇOSA') || combined.includes('GOIAS') || combined.includes('LONDRINA') || combined.includes('PARANÁ') || combined.includes('BRASÍLIA') || combined.includes('PIRACICABA') || combined.includes('MINAS GERAIS')) return 'BRASIL';
  if (combined.includes('COLOMBIA') || combined.includes('PALMIRA') || combined.includes('ANTIOQUIA') || combined.includes('BELLO') || combined.includes('VALLE DEL CAUCA')) return 'COLOMBIA';
  if (combined.includes('CHILE') || combined.includes('SANTIAGO')) return 'CHILE';
  if (combined.includes('COSTA RICA') || combined.includes('CARTAGO') || combined.includes('SAN JOSE') || combined.includes('SAN JOSÉ')) return 'COSTA RICA';
  if (combined.includes('SANGJU') || combined.includes('KOREA') || combined.includes('COREA') || combined.includes('KNU')) return 'COREA DEL SUR';
  if (combined.includes('FLORIDA') || combined.includes('GAINESVILLE') || combined.includes('USDA') || combined.includes('LAKE ALFRED') || combined.includes('VERMONT') || combined.includes('CALIFORNIA') || combined.includes('OTTAWA RDC') || combined.includes('NEW MEXICO')) return 'ESTADOS UNIDOS';
  if (combined.includes('ITALIA') || combined.includes('ITALY') || combined.includes('BARI') || combined.includes('CNR')) return 'ITALIA';
  if (combined.includes('OTTAWA') || combined.includes('CANADA')) return 'CANADA';
  if (combined.includes('NEW DELHI') || combined.includes('INDIA')) return 'INDIA';
  if (combined.includes('NIGERIA') || combined.includes('MAIDUGURI')) return 'NIGERIA';
  if (combined.includes('PARAGUAY') || combined.includes('ASUNCIÓN') || combined.includes('ASUNCION') || combined.includes('FERNANDO DE LA MORA')) return 'PARAGUAY';
  if (combined.includes('LOJA') || combined.includes('ECUADOR')) return 'ECUADOR';
  if (combined.includes('MEXICO') || combined.includes('OAXACA') || combined.includes('ESTADO DE MEXICO') || combined.includes('COLPOS')) return 'MEXICO';
  if (combined.includes('CHINA') || combined.includes('BEIJING') || combined.includes('TJELE')) return 'CHINA';
  if (combined.includes('WAGENINGEN') || combined.includes('NETHERLANDS') || combined.includes('PAÍSES BAJOS')) return 'PAÍSES BAJOS';
  return 'OTRO';
}

function parseCsv(text) {
  const result = Papa.parse(text, { header: true, delimiter: ';', skipEmptyLines: true });
  return result.data;
}

const chartBaseOptions = (horizontal = false) => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: horizontal ? 'y' : 'x',
  plugins: {
    legend: { display: false },
    tooltip: { bodyFont: { family: 'Outfit' }, titleFont: { family: 'Outfit', weight: '700' } },
    datalabels: {
      display: true,
      color: '#374151',
      font: { family: 'Outfit', size: 11, weight: '700' },
      anchor: horizontal ? 'end' : 'end',
      align: horizontal ? 'end' : 'top',
      offset: 2,
      formatter: (value) => value > 0 ? value : ''
    }
  },
  scales: {
    x: { ticks: { color: '#9ca3af', font: { family: 'Outfit', size: 11 } }, grid: { color: '#f3f4f6', display: !horizontal } },
    y: { ticks: { color: '#9ca3af', font: { family: 'Outfit', size: 11 } }, grid: { color: '#f3f4f6', display: horizontal } }
  }
});

const donutOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { color: '#374151', font: { family: 'Outfit', size: 12, weight: '600' }, padding: 16, boxWidth: 12, boxHeight: 12, borderRadius: 4 } },
    tooltip: { bodyFont: { family: 'Outfit' }, titleFont: { family: 'Outfit', weight: '700' } },
    datalabels: {
      display: true,
      color: '#ffffff',
      font: { family: 'Outfit', size: 12, weight: '700' },
      formatter: (value, ctx) => {
        const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
        const pct = ((value / total) * 100).toFixed(1);
        return pct > 5 ? `${value}\n(${pct}%)` : '';
      }
    }
  }
};

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { bodyFont: { family: 'Outfit' }, titleFont: { family: 'Outfit', weight: '700' } },
    datalabels: {
      display: true,
      color: '#dc2626',
      font: { family: 'Outfit', size: 11, weight: '700' },
      anchor: 'top',
      align: 'top',
      offset: 4,
      formatter: (value) => value > 0 ? value : ''
    }
  },
  scales: {
    x: { ticks: { color: '#9ca3af', font: { family: 'Outfit', size: 11 } }, grid: { display: false } },
    y: { ticks: { color: '#9ca3af', font: { family: 'Outfit', size: 11 } }, grid: { color: '#f3f4f6' } }
  }
};

// ─── COMPONENTS ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, prefix = '', suffix = '', color = 'red', icon, sub }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  const isFloat = typeof value === 'number' && value % 1 !== 0;
  const display = isFloat ? animated.toFixed(1) : Math.round(animated).toLocaleString('en-US');
  return (
    <div className="kpi-card">
      <div className={`kpi-card-accent ${color}`} />
      <div className="kpi-header">
        <div className="kpi-label">{label}</div>
        <div className={`kpi-icon ${color}`}>{icon}</div>
      </div>
      <div className="kpi-value">
        {prefix}{display}{suffix}
      </div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function Badge({ children, type = 'gray' }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}

function categoryBadge(cat) {
  if (!cat) return <Badge type="gray">Sin categoría</Badge>;
  const c = cat.toUpperCase();
  if (c.includes('MIEMBRO_ONTA_NAC')) return <Badge type="green">Miembro ONTA Nac.</Badge>;
  if (c.includes('MIEMBRO_ONTA')) return <Badge type="red">Miembro ONTA</Badge>;
  if (c.includes('NO_MIEMBRO_NAC')) return <Badge type="gold">No Miembro Nac.</Badge>;
  if (c.includes('NO_MIEMBRO')) return <Badge type="gray">No Miembro</Badge>;
  if (c.includes('NACIONAL')) return <Badge type="blue">Nacional</Badge>;
  if (c.includes('EXTRANJERO')) return <Badge type="gray">Extranjero</Badge>;
  return <Badge type="gray">{cat}</Badge>;
}

function CountryBars({ data }) {
  const countryCounts = useMemo(() => {
    const counts = {};
    data.forEach(u => {
      const c = detectCountry(u);
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [data]);

  const max = countryCounts[0]?.[1] || 1;

  return (
    <div className="country-bars">
      {countryCounts.map(([country, count]) => (
        <div key={country} className="country-bar-item">
          <div className="country-flag-name">
            <span className="country-flag">{COUNTRY_FLAGS[country] || '🌍'}</span>
            <span>{country.charAt(0) + country.slice(1).toLowerCase()}</span>
          </div>
          <div className="country-bar-track">
            <div className="country-bar-fill" style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <div className="country-count">{count}</div>
        </div>
      ))}
    </div>
  );
}

function SearchTable({ data, columns, title }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(q)));
  }, [data, search]);

  return (
    <div>
      <div className="search-bar">
        <span>🔍</span>
        <input
          type="text"
          placeholder={`Buscar en ${title}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Badge type="gray">{filtered.length} resultados</Badge>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map(c => <th key={c.key}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i}>
                {columns.map(c => (
                  <td key={c.key}>
                    {c.render ? c.render(row[c.key], row) : row[c.key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PAGE SECTIONS ──────────────────────────────────────────────────────────

function ResumenPage({ u, p, r }) {
  const totalIngresos = p.reduce((s, x) => s + (parseFloat(x['Monto ($)']) || 0), 0);
  const pct = u.length > 0 ? (p.length / u.length) * 100 : 0;
  const nacionales = u.filter(x => x['NACIONALIDAD'] === 'NACIONAL').length;
  const extranjeros = u.filter(x => x['NACIONALIDAD'] === 'EXTRANJERO').length;

  // Inscritos por mes
  const monthCounts = {};
  u.forEach(usr => {
    const fecha = usr['Fecha Registro'] || '';
    const parts = fecha.split(' ')[0]?.split('/');
    if (parts?.length >= 2) {
      const mes = `${parts[1]}/${parts[2]}`;
      monthCounts[mes] = (monthCounts[mes] || 0) + 1;
    }
  });
  const monthEntries = Object.entries(monthCounts).sort((a, b) => {
    const [ma, ya] = a[0].split('/');
    const [mb, yb] = b[0].split('/');
    return new Date(ya, ma - 1) - new Date(yb, mb - 1);
  });
  const lineData = {
    labels: monthEntries.map(([k]) => {
      const [m] = k.split('/');
      const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      return meses[parseInt(m)];
    }),
    datasets: [{
      label: 'Inscripciones',
      data: monthEntries.map(([, v]) => v),
      borderColor: '#dc2626',
      backgroundColor: 'rgba(220,38,38,0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#dc2626',
      pointRadius: 5
    }]
  };

  const nacData = {
    labels: ['Nacionales', 'Extranjeros'],
    datasets: [{ data: [nacionales, extranjeros], backgroundColor: ['#dc2626', '#d97706'], borderWidth: 0 }]
  };

  const lineasCounts = {};
  r.forEach(x => { const l = x['Línea'] || 'Otro'; lineasCounts[l] = (lineasCounts[l] || 0) + 1; });
  const lineasTop = Object.entries(lineasCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const lineasBar = {
    labels: lineasTop.map(([k]) => k.length > 28 ? k.slice(0, 28) + '…' : k),
    datasets: [{ data: lineasTop.map(([, v]) => v), backgroundColor: RED_PALETTE, borderRadius: 6 }]
  };

  return (
    <div>
      <div className="kpi-grid">
        <KpiCard label="Inscritos Totales" value={u.length} icon={<i className="bi bi-people-fill"/>} color="red" sub="Usuarios registrados" />
        <KpiCard label="Ingresos (USD)" value={totalIngresos} prefix="$" icon={<i className="bi bi-cash-coin"/>} color="gold" sub={`${p.length} transacciones`} />
        <KpiCard label="Resúmenes Recibidos" value={r.length} icon={<i className="bi bi-file-earmark-text-fill"/>} color="blue" sub="Trabajos científicos" />
        <KpiCard label="Tasa de Pago" value={pct} suffix="%" icon={<i className="bi bi-graph-up-arrow"/>} color="green" sub={`${p.length} de ${u.length} inscritos`} />
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title"><div className="card-title-dot" />Inscripciones por Mes</div>
          <div className="chart-box">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
        <div className="card">
          <div className="card-title"><div className="card-title-dot" />Nacional vs Extranjero</div>
          <div className="chart-box">
            <Doughnut data={nacData} options={donutOptions} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title"><div className="card-title-dot" />Principales Líneas de Investigación</div>
        <div className="chart-box" style={{ height: '220px' }}>
          <Bar data={lineasBar} options={chartBaseOptions()} />
        </div>
      </div>

      <div className="card">
        <div className="card-title"><div className="card-title-dot" />Distribución por País de Procedencia</div>
        <CountryBars data={u} />
      </div>
    </div>
  );
}

function UsuariosPage({ u }) {
  const catCounts = {};
  u.forEach(x => { const c = x['Categoría'] || 'OTRO'; catCounts[c] = (catCounts[c] || 0) + 1; });

  const catData = {
    labels: Object.keys(catCounts).map(k => k.replace('_', ' ').replace('_', ' ')),
    datasets: [{ data: Object.values(catCounts), backgroundColor: MULTI_PALETTE, borderWidth: 0 }]
  };

  const columns = [
    { key: 'Nombre', label: 'Nombre', render: v => <span className="td-name">{v}</span> },
    { key: 'Institución', label: 'Institución', render: v => <span style={{ fontSize: '0.82rem' }}>{v}</span> },
    { key: 'Departamento', label: 'Departamento/Ciudad' },
    { key: 'Categoría', label: 'Categoría', render: v => categoryBadge(v) },
    { key: 'NACIONALIDAD', label: 'Nac.', render: v => v === 'NACIONAL' ? <Badge type="blue">🇵🇪 Nacional</Badge> : <Badge type="gold">✈️ Extranjero</Badge> },
    { key: 'Fecha Registro', label: 'Fecha', render: v => <span className="td-date">{v?.split(' ')[0]}</span> },
  ];

  return (
    <div>
      <div className="kpi-grid">
        <KpiCard label="Total Inscritos" value={u.length} icon={<i className="bi bi-people-fill"/>} color="red" />
        <KpiCard label="Nacionales" value={u.filter(x => x['NACIONALIDAD'] === 'NACIONAL').length} icon={<i className="bi bi-house-fill"/>} color="blue" />
        <KpiCard label="Extranjeros" value={u.filter(x => x['NACIONALIDAD'] === 'EXTRANJERO').length} icon={<i className="bi bi-airplane-fill"/>} color="gold" />
        <KpiCard label="Miembros ONTA" value={u.filter(x => (x['Categoría'] || '').includes('MIEMBRO_ONTA')).length} icon={<i className="bi bi-patch-check-fill"/>} color="green" />
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title"><div className="card-title-dot" />Mapa Mundial de Participantes</div>
        <WorldMap countryCounts={(() => {
          const counts = {};
          u.forEach(usr => { const c = detectCountry(usr); counts[c] = (counts[c] || 0) + 1; });
          return counts;
        })()} />
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title"><div className="card-title-dot" />Categorías de Inscripción</div>
          <div className="chart-box">
            <Doughnut data={catData} options={donutOptions} />
          </div>
        </div>
        <div className="card">
          <div className="card-title"><div className="card-title-dot" />Participantes por País</div>
          <CountryBars data={u} />
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>📋 Base de Datos — Usuarios Registrados</h2>
        </div>
        <SearchTable data={u} title="Usuarios" columns={columns} />
      </div>
    </div>
  );
}

function PagosPage({ p }) {
  const total = p.reduce((s, x) => s + (parseFloat(x['Monto ($)']) || 0), 0);
  const avgTicket = p.length > 0 ? total / p.length : 0;

  const metodoCounts = {};
  p.forEach(x => { const m = x['Método Pago'] || 'OTRO'; metodoCounts[m] = (metodoCounts[m] || 0) + 1; });
  const metodoData = {
    labels: Object.keys(metodoCounts),
    datasets: [{ data: Object.values(metodoCounts), backgroundColor: ['#dc2626', '#d97706', '#2563eb'], borderWidth: 0 }]
  };

  const montosCounts = {};
  p.forEach(x => { const m = x['Monto ($)'] || '0'; montosCounts[m] = (montosCounts[m] || 0) + 1; });
  const montosData = {
    labels: Object.keys(montosCounts).sort((a, b) => Number(a) - Number(b)),
    datasets: [{
      label: 'Transacciones',
      data: Object.keys(montosCounts).sort((a, b) => Number(a) - Number(b)).map(k => montosCounts[k]),
      backgroundColor: '#dc2626',
      borderRadius: 6
    }]
  };

  const columns = [
    { key: 'Fecha Registro', label: 'Fecha', render: v => <span className="td-date">{v?.split(' ')[0]}</span> },
    { key: 'Nombre Completo', label: 'Participante', render: v => <span className="td-name">{v}</span> },
    { key: 'Institución', label: 'Institución', render: v => <span style={{ fontSize: '0.82rem' }}>{v}</span> },
    { key: 'Método Pago', label: 'Método', render: v => <Badge type={v === 'CULQI' ? 'red' : 'blue'}>{v}</Badge> },
    { key: 'Monto ($)', label: 'Monto (USD)', render: v => <span className="td-amount">${parseFloat(v).toLocaleString()}</span> },
  ];

  return (
    <div>
      <div className="kpi-grid">
        <KpiCard label="Ingresos Totales" value={total} prefix="$" icon={<i className="bi bi-cash-coin"/>} color="gold" sub="USD recaudados" />
        <KpiCard label="Transacciones" value={p.length} icon={<i className="bi bi-credit-card-fill"/>} color="red" sub="Pagos completados" />
        <KpiCard label="Ticket Promedio" value={Math.round(avgTicket)} prefix="$" icon={<i className="bi bi-graph-up-arrow"/>} color="green" sub="USD promedio" />
        <KpiCard label="Vía CULQI" value={p.filter(x => x['Método Pago'] === 'CULQI').length} icon={<i className="bi bi-globe"/>} color="blue" sub="Pagos online" />
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title"><div className="card-title-dot" />Distribución por Tarifa</div>
          <div className="chart-box">
            <Bar data={montosData} options={chartBaseOptions()} />
          </div>
        </div>
        <div className="card">
          <div className="card-title"><div className="card-title-dot" />Métodos de Pago</div>
          <div className="chart-box">
            <Doughnut data={metodoData} options={donutOptions} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>💳 Base de Datos — Pagos Realizados</h2>
        </div>
        <SearchTable data={p} title="Pagos" columns={columns} />
      </div>
    </div>
  );
}

function ResumenesPage({ r }) {
  const [selectedAbstract, setSelectedAbstract] = useState(null);
  const modCounts = {};
  r.forEach(x => { const m = x['MODALIDAD'] || 'OTRO'; modCounts[m] = (modCounts[m] || 0) + 1; });
  const modData = {
    labels: Object.keys(modCounts),
    datasets: [{ data: Object.values(modCounts), backgroundColor: ['#dc2626', '#2563eb'], borderWidth: 0 }]
  };

  const lineaCounts = {};
  r.forEach(x => { const l = x['Línea'] || 'Otro'; lineaCounts[l] = (lineaCounts[l] || 0) + 1; });
  const lineaEntries = Object.entries(lineaCounts).sort((a, b) => b[1] - a[1]);
  const lineaData = {
    labels: lineaEntries.map(([k]) => k.length > 25 ? k.slice(0, 25) + '…' : k),
    datasets: [{ label: 'Trabajos', data: lineaEntries.map(([, v]) => v), backgroundColor: RED_PALETTE, borderRadius: 4 }]
  };

  const afilCounts = {};
  r.forEach(x => { const a = (x['Afiliación'] || '').split(',')[0].trim(); afilCounts[a] = (afilCounts[a] || 0) + 1; });
  const topAfil = Object.entries(afilCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const columns = [
    { key: 'MODALIDAD', label: 'Tipo', render: v => <Badge type={v === 'ORAL' ? 'red' : 'blue'}>{v}</Badge> },
    { key: 'Título', label: 'Título', render: (v) => (
      <span style={{ fontSize: '0.83rem', fontWeight: 500, color: '#111827', display: 'block', wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.4, maxWidth: '360px' }} title={v}>{v}</span>
    )},
    { key: 'Línea', label: 'Área', render: v => <Badge type="gold">{v}</Badge> },
    { key: 'Fecha Envío', label: 'Envío', render: v => <span className="td-date">{v?.split(' ')[0]}</span> },
  ];

  return (
    <div>
      <div className="kpi-grid">
        <KpiCard label="Total Resúmenes" value={r.length} icon={<i className="bi bi-file-earmark-text-fill"/>} color="red" />
        <KpiCard label="Presentaciones Orales" value={modCounts['ORAL'] || 0} icon={<i className="bi bi-mic-fill"/>} color="blue" />
        <KpiCard label="Pósters" value={modCounts['POSTER'] || 0} icon={<i className="bi bi-image-fill"/>} color="gold" />
        <KpiCard label="Áreas Temáticas" value={Object.keys(lineaCounts).length} icon={<i className="bi bi-bead-fill"/>} color="green" />
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title"><div className="card-title-dot" />Trabajos por Área Temática</div>
          <div className="chart-box" style={{ height: '280px' }}>
            <Bar data={lineaData} options={{ ...chartBaseOptions(true), plugins: { legend: { display: false } } }} />
          </div>
        </div>
        <div className="card">
          <div className="card-title"><div className="card-title-dot" />Modalidad de Presentación</div>
          <div className="chart-box">
            <Doughnut data={modData} options={donutOptions} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title"><div className="card-title-dot" />Top Instituciones por Número de Resúmenes</div>
        {topAfil.map(([inst, n], i) => {
          const pct = (n / (topAfil[0]?.[1] || 1)) * 100;
          return (
            <div key={i}>
              <div className="progress-label">
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{inst.length > 50 ? inst.slice(0, 50) + '…' : inst}</span>
                <span style={{ fontWeight: 700, color: '#dc2626' }}>{n}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, #dc2626, #f87171)` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="section-header">
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>🔬 Base de Datos — Resúmenes Científicos</h2>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}><i className="bi bi-hand-index-fill" style={{ marginRight: 4 }} />Clic en una fila para ver detalle</span>
        </div>
        <div className="search-bar">
          <i className="bi bi-search" style={{ color: '#9ca3af' }}></i>
          <input type="text" placeholder="Buscar en Resúmenes..." onChange={e => {
            const q = e.target.value.toLowerCase();
            // filtering handled inline
            e._query = q;
          }} id="res-search" />
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Título</th>
                <th>Área</th>
                <th>Envío</th>
              </tr>
            </thead>
            <tbody>
              {r.filter(row => {
                const input = document.getElementById('res-search');
                if (!input || !input.value) return true;
                const q = input.value.toLowerCase();
                return Object.values(row).some(v => String(v).toLowerCase().includes(q));
              }).map((row, i) => (
                <tr key={i}
                  onClick={() => setSelectedAbstract(row)}
                  style={{ cursor: 'pointer' }}
                  title="Clic para ver detalle completo"
                >
                  <td><span style={{
                    background: row['MODALIDAD'] === 'ORAL' ? '#fef2f2' : '#dbeafe',
                    color: row['MODALIDAD'] === 'ORAL' ? '#dc2626' : '#2563eb',
                    padding: '0.25rem 0.65rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700,
                    border: `1px solid ${row['MODALIDAD'] === 'ORAL' ? '#fecaca' : '#bfdbfe'}`,
                    whiteSpace: 'nowrap',
                  }}>
                    <i className={`bi ${row['MODALIDAD'] === 'ORAL' ? 'bi-mic-fill' : 'bi-image-fill'}`} style={{ marginRight: 4 }} />
                    {row['MODALIDAD']}
                  </span></td>
                  <td><span style={{ fontSize: '0.83rem', fontWeight: 500, color: '#111827', display: 'block', wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.4, maxWidth: '360px' }}>{row['Título']}</span></td>
                  <td><span style={{ background: '#fef3c7', color: '#d97706', padding: '0.25rem 0.65rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, border: '1px solid #fde68a', whiteSpace: 'nowrap' }}>{row['Línea']}</span></td>
                  <td><span className="td-date">{row['Fecha Envío']?.split(' ')[0]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAbstract && (
        <AbstractModal abstract={selectedAbstract} onClose={() => setSelectedAbstract(null)} />
      )}
    </div>
  );
}

// ─── CONFIRMADOS PAGE ──────────────────────────────────────────────────────────

function normalize(str) {
  return (str || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function ConfirmadosPage({ u, p }) {
  const pagosMap = useMemo(() => {
    const map = {};
    p.forEach(pago => {
      const key = normalize(pago['Nombre Completo']);
      map[key] = pago;
    });
    return map;
  }, [p]);

  const confirmados = useMemo(() =>
    u.map(usr => {
      const key = normalize(usr['Nombre']);
      // Try exact match first, then partial
      let pago = pagosMap[key];
      if (!pago) {
        const found = Object.keys(pagosMap).find(k =>
          k.includes(key.split(' ')[0]) && k.includes(key.split(' ').slice(-1)[0])
        );
        if (found) pago = pagosMap[found];
      }
      return { ...usr, pago: pago || null };
    })
  , [u, pagosMap]);

  const pagados = confirmados.filter(x => x.pago);
  const pendientes = confirmados.filter(x => !x.pago);
  const totalRecaudado = pagados.reduce((s, x) => s + (parseFloat(x.pago?.['Monto ($)']) || 0), 0);

  const [tab, setTab] = useState('pagados');
  const [search, setSearch] = useState('');

  const lista = tab === 'pagados' ? pagados : pendientes;
  const filtrada = search
    ? lista.filter(r => Object.values(r).some(v => normalize(String(v)).includes(normalize(search))))
    : lista;

  return (
    <div>
      <div className="kpi-grid">
        <KpiCard label="Inscritos Totales" value={u.length} icon={<i className="bi bi-people-fill"/>} color="red" />
        <KpiCard label="Han Pagado" value={pagados.length} icon={<i className="bi bi-check-circle-fill"/>} color="green" sub="Confirmados" />
        <KpiCard label="Pendientes de Pago" value={pendientes.length} icon={<i className="bi bi-clock-fill"/>} color="gold" sub="Sin confirmación" />
        <KpiCard label="Recaudado (USD)" value={totalRecaudado} prefix="$" icon={<i className="bi bi-cash-stack"/>} color="blue" />
      </div>

      {/* Progress bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title"><div className="card-title-dot" />Progreso de Confirmación de Pagos</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 700, color: '#16a34a' }}>
            <i className="bi bi-check-circle-fill" style={{ marginRight: 4 }}></i>
            {pagados.length} confirmados ({((pagados.length / u.length) * 100).toFixed(1)}%)
          </span>
          <span style={{ fontWeight: 700, color: '#d97706' }}>
            {pendientes.length} pendientes ({((pendientes.length / u.length) * 100).toFixed(1)}%)
          </span>
        </div>
        <div className="progress-track" style={{ height: 14, borderRadius: 10 }}>
          <div className="progress-fill" style={{
            width: `${(pagados.length / u.length) * 100}%`,
            background: 'linear-gradient(90deg, #16a34a, #4ade80)'
          }} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {pagados.slice(0, 6).map((usr, i) => (
            <span key={i} style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.7rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600 }}>
              <i className="bi bi-check2" style={{ marginRight: 3 }}></i>{usr['Nombre'].split(' ').slice(0, 2).join(' ')}
            </span>
          ))}
          {pagados.length > 6 && (
            <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '0.2rem 0.7rem', borderRadius: 999, fontSize: '0.78rem' }}>+{pagados.length - 6} más</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid #f3f4f6', paddingBottom: '0.75rem' }}>
          <button
            onClick={() => setTab('pagados')}
            style={{
              padding: '0.45rem 1.2rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.9rem',
              background: tab === 'pagados' ? '#dc2626' : '#f9fafb',
              color: tab === 'pagados' ? '#fff' : '#6b7280',
              transition: 'all 0.2s'
            }}
          >
            <i className="bi bi-check-circle-fill" style={{ marginRight: 6 }}></i>
            Pagados ({pagados.length})
          </button>
          <button
            onClick={() => setTab('pendientes')}
            style={{
              padding: '0.45rem 1.2rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.9rem',
              background: tab === 'pendientes' ? '#d97706' : '#f9fafb',
              color: tab === 'pendientes' ? '#fff' : '#6b7280',
              transition: 'all 0.2s'
            }}
          >
            <i className="bi bi-clock-fill" style={{ marginRight: 6 }}></i>
            Pendientes ({pendientes.length})
          </button>
        </div>

        <div className="search-bar">
          <i className="bi bi-search" style={{ color: '#9ca3af' }}></i>
          <input
            type="text"
            placeholder="Buscar participante..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Badge type="gray">{filtrada.length} resultados</Badge>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Nombre</th>
                <th>Institución</th>
                <th>Categoría</th>
                <th>Nacionalidad</th>
                {tab === 'pagados' && <><th>Método Pago</th><th>Monto (USD)</th><th>Fecha Pago</th></>}
                {tab === 'pendientes' && <th>Fecha Registro</th>}
              </tr>
            </thead>
            <tbody>
              {filtrada.map((row, i) => (
                <tr key={i}>
                  <td>
                    {row.pago
                      ? <Badge type="green"><i className="bi bi-check-circle-fill" style={{ marginRight: 4 }}></i>Pagado</Badge>
                      : <Badge type="gold"><i className="bi bi-clock-fill" style={{ marginRight: 4 }}></i>Pendiente</Badge>
                    }
                  </td>
                  <td><span className="td-name">{row['Nombre']}</span></td>
                  <td><span style={{ fontSize: '0.82rem' }}>{row['Institución']}</span></td>
                  <td>{categoryBadge(row['Categoría'])}</td>
                  <td>
                    {row['NACIONALIDAD'] === 'NACIONAL'
                      ? <Badge type="blue"><i className="bi bi-house-fill" style={{ marginRight: 3 }}></i>Nacional</Badge>
                      : <Badge type="gold"><i className="bi bi-airplane-fill" style={{ marginRight: 3 }}></i>Extranjero</Badge>
                    }
                  </td>
                  {tab === 'pagados' && (
                    <>
                      <td><Badge type={row.pago?.['Método Pago'] === 'CULQI' ? 'red' : 'blue'}>{row.pago?.['Método Pago']}</Badge></td>
                      <td><span className="td-amount">${parseFloat(row.pago?.['Monto ($)'] || 0).toLocaleString()}</span></td>
                      <td><span className="td-date">{row.pago?.['Fecha Registro']?.split(' ')[0]}</span></td>
                    </>
                  )}
                  {tab === 'pendientes' && (
                    <td><span className="td-date">{row['Fecha Registro']?.split(' ')[0]}</span></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────────

const PAGES = [
  { id: 'resumen', label: 'Vista General', icon: 'bi bi-grid-1x2-fill', group: 'Panel' },
  { id: 'usuarios', label: 'Usuarios', icon: 'bi bi-people-fill', group: 'Módulos' },
  { id: 'pagos', label: 'Pagos', icon: 'bi bi-credit-card-fill', group: 'Módulos' },
  { id: 'resumenes', label: 'Resúmenes Científicos', icon: 'bi bi-file-earmark-text-fill', group: 'Módulos' },
  { id: 'confirmados', label: 'Confirmados / Pendientes', icon: 'bi bi-check2-circle', group: 'Módulos' },
  { id: 'timeline', label: 'Línea de Tiempo', icon: 'bi bi-calendar3-event-fill', group: 'Módulos' },
];

const PAGE_TITLES = {
  resumen: 'Vista General del Congreso',
  usuarios: 'Gestión de Usuarios',
  pagos: 'Reporte de Pagos',
  resumenes: 'Resúmenes Científicos',
  confirmados: 'Inscritos Confirmados con Pago',
  timeline: 'Línea de Tiempo — Inscripciones y Pagos'
};

export default function App() {
  const [activePage, setActivePage] = useState('resumen');
  const [csvData, setCsvData] = useState({ usuarios: [], pagos: [], resumenes: [] });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setExportProgress(0);
    try {
      await exportFullPDF(csvData, (pct) => setExportProgress(pct));
    } catch (e) {
      console.error('PDF export failed', e);
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        const fetchCsv = async (url) => {
          const r = await fetch(url);
          return parseCsv(await r.text());
        };
        const [u, p, res] = await Promise.all([
          fetchCsv('/usuarios_onta2026_2026-09-29.csv'),
          fetchCsv('/pagos_onta2026_2026-09-29.csv'),
          fetchCsv('/resumenes_onta2026_2026-09-29.csv'),
        ]);
        setCsvData({ usuarios: u, pagos: p, resumenes: res });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Cargando datos de ONTA Perú 2026...
      </div>
    );
  }

  const groups = [...new Set(PAGES.map(p => p.group))];

  return (
    <div className="app-layout">
      {/* SIDEBAR BACKDROP FOR MOBILE */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/imagen.png" alt="ONTA" />
          <div className="sidebar-logo-text">
            <h2>ONTA Perú 2026</h2>
            <span>56ª Reunión Anual</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <nav className="sidebar-nav">
          {groups.map(group => (
            <div key={group}>
              <div className="nav-group-label">{group}</div>
              {PAGES.filter(p => p.group === group).map(page => (
                <button
                  key={page.id}
                  className={`nav-item ${activePage === page.id ? 'active' : ''}`}
                  onClick={() => {
                    setActivePage(page.id);
                    setSidebarOpen(false);
                  }}
                >
                  <i className={`nav-icon ${page.icon}`}></i>
                  <span>{page.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        {/* Mascota ONTA */}
        <div className="sidebar-mascot">
          <img
            src="/mascota.png"
            alt="Mascota ONTA"
            className="mascot-img"
          />
        </div>
        <div className="sidebar-footer">
          Actualizado al 29/09/2026<br />
          Puno, Perú · 9–13 Nov 2026
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <button
              className="menu-toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Abrir o cerrar menú de navegación"
            >
              <i className="bi bi-list" />
            </button>
            <div className="topbar-title-wrap">
              <h1>{PAGE_TITLES[activePage]}</h1>
              <div className="topbar-badge topbar-badge-mobile">
                <i className="bi bi-circle-fill dot-pulse" />
                En vivo
              </div>
            </div>
          </div>

          <div className="topbar-right">
            <Countdown />
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-export-pdf"
            >
              {exporting ? (
                <>
                  <i className="bi bi-hourglass-split spin" />
                  <span>{exportProgress}%</span>
                </>
              ) : (
                <>
                  <i className="bi bi-file-earmark-pdf-fill" />
                  <span>Exportar PDF</span>
                </>
              )}
            </button>
            <div className="topbar-badge topbar-badge-desktop">
              <i className="bi bi-circle-fill dot-pulse" />
              En vivo · ONTA 2026
            </div>
          </div>
        </div>

        <div className="page-content">
          {activePage === 'resumen' && (
            <ResumenPage u={csvData.usuarios} p={csvData.pagos} r={csvData.resumenes} />
          )}
          {activePage === 'usuarios' && (
            <UsuariosPage u={csvData.usuarios} />
          )}
          {activePage === 'pagos' && (
            <PagosPage p={csvData.pagos} />
          )}
          {activePage === 'resumenes' && (
            <ResumenesPage r={csvData.resumenes} />
          )}
          {activePage === 'confirmados' && (
            <ConfirmadosPage u={csvData.usuarios} p={csvData.pagos} />
          )}
          {activePage === 'timeline' && (
            <div className="card">
              <div className="card-title"><div className="card-title-dot" />Registro cronológico de inscripciones y pagos</div>
              <TimelineView usuarios={csvData.usuarios} pagos={csvData.pagos} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
