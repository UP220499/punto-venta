import { useState, useEffect } from 'react'
import { useTickets } from '../../features/sales/useTickets'
import { TicketDetailModal } from './TicketDetailModal'

const PAGE_SIZE = 20

/* ── formatters ──────────────────────────────────────────── */

const currencyFmt = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})
function fmt(amount) {
  return currencyFmt.format(amount ?? 0)
}

const dateFmt = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'short',
  timeStyle: 'short',
})
function fmtDate(iso) {
  if (!iso) return '—'
  return dateFmt.format(new Date(iso))
}

/* ── icons ───────────────────────────────────────────────── */

function IconSpinner() {
  return (
    <svg className="animate-spin w-5 h-5 text-[--brand]" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function IconInbox() {
  return (
    <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
    </svg>
  )
}

function IconError() {
  return (
    <svg className="w-10 h-10 text-red-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  )
}

/* ── status badge ────────────────────────────────────────── */

function EstatusBadge({ estatus }) {
  if (estatus === 'CERRADO') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
        Cerrado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
      Borrador
    </span>
  )
}

/* ── empty / loading / error states ─────────────────────── */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <IconSpinner />
      <p className="text-sm">Cargando tickets…</p>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <IconError />
      <p className="text-sm text-red-500">{message}</p>
    </div>
  )
}

function EmptyState({ hasFilters, onClearFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <IconInbox />
      <p className="text-sm font-medium text-gray-500">
        {hasFilters ? 'No se encontraron tickets con esos filtros.' : 'Aún no hay tickets registrados.'}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="text-sm text-[--brand] hover:text-[--brand-active] font-medium transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

/* ── main page ───────────────────────────────────────────── */

export function TicketsHistoryPage() {
  const [page, setPage] = useState(1)
  const [folioInput, setFolioInput] = useState('')
  const [debouncedFolio, setDebouncedFolio] = useState('')
  const [estatusFilter, setEstatusFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedTicketId, setSelectedTicketId] = useState(null)

  // Debounce folio input — resets page after 400 ms of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFolio(folioInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [folioInput])

  const { data, isLoading, isError, error } = useTickets({
    page,
    pageSize: PAGE_SIZE,
    estatus: estatusFilter,
    folio: debouncedFolio,
    from: fromDate,
    to: toDate,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1
  const fromRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const toRow = Math.min(page * PAGE_SIZE, total)

  const hasFilters = folioInput !== '' || estatusFilter !== '' || fromDate !== '' || toDate !== ''

  const errorMessage =
    error?.response?.data?.message ??
    error?.message ??
    'Error al cargar los tickets.'

  function changeFilter(setter) {
    return (value) => {
      setter(value)
      setPage(1)
    }
  }

  function clearFilters() {
    setFolioInput('')
    setDebouncedFolio('')
    setEstatusFilter('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Historial de ventas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Consulta y detalle de tickets registrados</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Folio</label>
          <input
            type="number"
            min={1}
            placeholder="Ej: 42"
            value={folioInput}
            onChange={(e) => setFolioInput(e.target.value)}
            className="w-28 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[--brand] focus:border-transparent transition"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</label>
          <select
            value={estatusFilter}
            onChange={(e) => changeFilter(setEstatusFilter)(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[--brand] focus:border-transparent transition"
          >
            <option value="">Todos</option>
            <option value="CERRADO">Cerrado</option>
            <option value="BORRADOR">Borrador</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Desde</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => changeFilter(setFromDate)(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[--brand] focus:border-transparent transition"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hasta</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => changeFilter(setToDate)(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[--brand] focus:border-transparent transition"
          />
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState message={errorMessage} />
        ) : items.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClearFilters={clearFilters} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Folio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Cambio
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {items.map((t) => (
                    <tr key={t.ticket_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono font-semibold text-gray-900 tabular-nums">
                        {t.folio != null ? `#${String(t.folio).padStart(4, '0')}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {fmtDate(t.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <EstatusBadge estatus={t.estatus} />
                      </td>
                      <td className="px-6 py-4 text-right text-sm tabular-nums font-semibold text-gray-900">
                        {fmt(t.total)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm tabular-nums">
                        {t.cambio > 0 ? (
                          <span className="text-emerald-600 font-medium">{fmt(t.cambio)}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTicketId(t.ticket_id)}
                          className="text-[--brand] hover:text-[--brand-active] text-sm font-medium transition-colors"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Mostrando {fromRow}–{toRow} de {total} tickets
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-600 tabular-nums px-1">{page} / {totalPages}</span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}

            {/* Row count summary (single page) */}
            {totalPages === 1 && total > 0 && (
              <div className="px-6 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-400">{total} ticket{total !== 1 ? 's' : ''}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail modal */}
      <TicketDetailModal
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
      />
    </div>
  )
}
