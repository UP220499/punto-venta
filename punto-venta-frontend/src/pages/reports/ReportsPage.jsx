import { useState } from 'react'
import {
  useReportsSalesSummary,
  useReportsSalesByDay,
  useReportsTopProducts,
  useReportsInventorySummary,
} from '../../features/reports/useReports'

/* ── date helpers ────────────────────────────────────── */

function toISO(d) {
  return d.toISOString().slice(0, 10)
}

const PRESETS = [
  { key: 'today',     label: 'Hoy' },
  { key: 'yesterday', label: 'Ayer' },
  { key: '7days',     label: '7 días' },
  { key: '30days',    label: '30 días' },
  { key: 'thisMonth', label: 'Este mes' },
]

function resolvePreset(key) {
  const today = new Date()
  const todayStr = toISO(today)
  switch (key) {
    case 'today':
      return { from: todayStr, to: todayStr }
    case 'yesterday': {
      const y = new Date(today)
      y.setDate(y.getDate() - 1)
      const s = toISO(y)
      return { from: s, to: s }
    }
    case '7days': {
      const d = new Date(today)
      d.setDate(d.getDate() - 6)
      return { from: toISO(d), to: todayStr }
    }
    case '30days': {
      const d = new Date(today)
      d.setDate(d.getDate() - 29)
      return { from: toISO(d), to: todayStr }
    }
    case 'thisMonth': {
      const d = new Date(today.getFullYear(), today.getMonth(), 1)
      return { from: toISO(d), to: todayStr }
    }
    default:
      return { from: todayStr, to: todayStr }
  }
}

/* ── formatters ──────────────────────────────────────── */

const currFmt = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})
const intFmt = new Intl.NumberFormat('es-MX')

function fmtCur(val) { return currFmt.format(parseFloat(val) || 0) }
function fmtInt(val) { return intFmt.format(Number(val) || 0) }
function fmtQty(val) {
  const n = parseFloat(val) || 0
  return n.toLocaleString('es-MX', { maximumFractionDigits: 3 })
}

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
function fmtDate(str) {
  // str = "2024-01-15" — parse as local date to avoid UTC offset issues
  const [y, m, d] = str.split('-').map(Number)
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`
}

/* ── icons ───────────────────────────────────────────── */

function IconSpinner({ className = 'w-5 h-5 text-indigo-500' }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

/* ── metric card ─────────────────────────────────────── */

function MetricCard({ label, value, sub, loading }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      {loading ? (
        <div className="h-8 flex items-center">
          <IconSpinner className="w-4 h-4 text-gray-300" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </>
      )}
    </div>
  )
}

/* ── section wrapper ─────────────────────────────────── */

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  )
}

/* ── sales by day table ──────────────────────────────── */

function SalesByDayTable({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-10 gap-2 text-gray-400">
        <IconSpinner className="w-4 h-4 text-gray-300" />
        <span className="text-sm">Cargando…</span>
      </div>
    )
  }

  const items = data?.items ?? []

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 py-10 text-center text-sm text-gray-400">
        Sin ventas en el rango seleccionado
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Tickets
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total bruto
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {items.map((row) => (
            <tr key={row.date} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-700">{fmtDate(row.date)}</td>
              <td className="px-4 py-3 text-sm text-gray-700 text-right tabular-nums">
                {fmtInt(row.tickets_count)}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right tabular-nums">
                {fmtCur(row.gross_sales)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── top products table ──────────────────────────────── */

function TopProductsTable({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-10 gap-2 text-gray-400">
        <IconSpinner className="w-4 h-4 text-gray-300" />
        <span className="text-sm">Cargando…</span>
      </div>
    )
  }

  const items = data?.items ?? []

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 py-10 text-center text-sm text-gray-400">
        Sin productos vendidos en el rango seleccionado
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Producto
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Unidades
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total bruto
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {items.map((p, idx) => (
            <tr key={p.product_id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-400 tabular-nums">{idx + 1}</td>
              <td className="px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">{p.nombre}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{p.sku}</p>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 text-right tabular-nums">
                {fmtInt(p.qty_sold)}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right tabular-nums">
                {fmtCur(p.gross_sales)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── main page ───────────────────────────────────────── */

export function ReportsPage() {
  const initRange = resolvePreset('7days')
  const [from, setFrom] = useState(initRange.from)
  const [to, setTo]     = useState(initRange.to)
  const [activePreset, setActivePreset] = useState('7days')

  function applyPreset(key) {
    const range = resolvePreset(key)
    setFrom(range.from)
    setTo(range.to)
    setActivePreset(key)
  }

  function handleFrom(e) {
    setFrom(e.target.value)
    setActivePreset(null)
  }

  function handleTo(e) {
    setTo(e.target.value)
    setActivePreset(null)
  }

  const { data: summary, isLoading: loadingSummary } = useReportsSalesSummary({ from, to })
  const { data: byDay,   isLoading: loadingByDay }   = useReportsSalesByDay({ from, to })
  const { data: topProd, isLoading: loadingTopProd } = useReportsTopProducts({ from, to })
  const { data: invData, isLoading: loadingInv }     = useReportsInventorySummary({ from, to })

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-gray-200 bg-white">
        <div className="flex flex-wrap items-end gap-4 justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reportes</h1>
            <p className="text-sm text-gray-500 mt-0.5">Métricas de ventas e inventario</p>
          </div>

          {/* Date range controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick presets */}
            <div className="flex items-center gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activePreset === p.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Manual date inputs */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={from}
                max={to}
                onChange={handleFrom}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <span className="text-gray-400 text-sm">—</span>
              <input
                type="date"
                value={to}
                min={from}
                onChange={handleTo}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">

          {/* Sales metrics */}
          <Section title="Resumen de ventas">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Tickets cerrados"
                value={summary ? fmtInt(summary.tickets_count) : '—'}
                loading={loadingSummary}
              />
              <MetricCard
                label="Ventas brutas"
                value={summary ? fmtCur(summary.gross_sales) : '—'}
                loading={loadingSummary}
              />
              <MetricCard
                label="Total cobrado"
                value={summary ? fmtCur(summary.payments_total) : '—'}
                loading={loadingSummary}
              />
              <MetricCard
                label="Ticket promedio"
                value={summary ? fmtCur(summary.avg_ticket) : '—'}
                loading={loadingSummary}
              />
            </div>
          </Section>

          {/* Inventory metrics */}
          <Section title="Movimientos de inventario">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                label="Entradas de stock"
                value={invData ? fmtQty(invData.entries_qty) : '—'}
                sub="unidades"
                loading={loadingInv}
              />
              <MetricCard
                label="Ajustes manuales"
                value={invData ? fmtQty(invData.adjustments_qty) : '—'}
                sub="unidades"
                loading={loadingInv}
              />
              <MetricCard
                label="Salidas por ventas"
                value={invData ? fmtQty(invData.sales_qty) : '—'}
                sub="unidades"
                loading={loadingInv}
              />
            </div>
          </Section>

          {/* Sales by day */}
          <Section title="Ventas por día">
            <SalesByDayTable data={byDay} loading={loadingByDay} />
          </Section>

          {/* Top products */}
          <Section title="Productos más vendidos">
            <TopProductsTable data={topProd} loading={loadingTopProd} />
          </Section>

        </div>
      </div>
    </div>
  )
}
