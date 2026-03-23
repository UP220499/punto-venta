import { useTicketDetail } from '../../features/sales/useTicketDetail'
import { useSettings } from '../../features/settings/useSettings'
import { TicketPrintView } from './TicketPrintView'

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
  dateStyle: 'medium',
  timeStyle: 'short',
})
function fmtDate(iso) {
  if (!iso) return '—'
  return dateFmt.format(new Date(iso))
}

/* ── icons ───────────────────────────────────────────────── */

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function IconSpinner() {
  return (
    <svg className="animate-spin w-5 h-5 text-[--brand]" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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

/* ── main modal ──────────────────────────────────────────── */

/**
 * TicketDetailModal
 *
 * Props:
 *   ticketId  number | null  — ticket to load; null = modal hidden
 *   onClose   () => void
 */
export function TicketDetailModal({ ticketId, onClose }) {
  const { data, isLoading, isError } = useTicketDetail(ticketId)
  const { data: settings } = useSettings()

  if (ticketId == null) return null

  const ticket = data?.ticket ?? null
  const items = data?.items ?? []
  const payments = data?.payments ?? []

  return (
    <>
    {/* Print-only receipt — hidden on screen, visible at @media print */}
    {ticket && (
      <TicketPrintView
        ticket={ticket}
        items={items}
        payments={payments}
        headerText={settings?.ticket_header_text || null}
        footerText={settings?.ticket_footer_text || null}
        folioPadding={settings?.ticket_folio_padding ?? 4}
      />
    )}

    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg z-10 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">
              {ticket
                ? ticket.folio != null
                  ? `Ticket #${String(ticket.folio).padStart(settings?.ticket_folio_padding ?? 4, '0')}`
                  : 'Ticket (Borrador)'
                : 'Detalle del ticket'}
            </h2>
            {ticket && <EstatusBadge estatus={ticket.estatus} />}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors ml-3"
            aria-label="Cerrar"
          >
            <IconX />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
              <IconSpinner />
              <span className="text-sm">Cargando detalle…</span>
            </div>
          )}

          {isError && (
            <p className="text-center text-sm text-red-500 py-12">
              Error al cargar el ticket. Intenta de nuevo.
            </p>
          )}

          {!isLoading && !isError && ticket && (
            <div className="space-y-5">

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Creado</p>
                  <p className="text-gray-700">{fmtDate(ticket.created_at)}</p>
                </div>
                {ticket.closed_at && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Cerrado</p>
                    <p className="text-gray-700">{fmtDate(ticket.closed_at)}</p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Artículos</p>
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Cant.
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          P. Unit.
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {items.map((item) => (
                        <tr key={item.item_id}>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">{item.product_nombre_snapshot}</p>
                            <p className="text-xs text-gray-400">{item.product_sku_snapshot}</p>
                          </td>
                          <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-700">
                            {Number(item.cantidad)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-700">
                            {fmt(item.precio_unitario)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm tabular-nums font-medium text-gray-900">
                            {fmt(item.subtotal_linea)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments */}
              {payments.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Pagos</p>
                  <div className="space-y-2">
                    {payments.map((p) => (
                      <div
                        key={p.payment_id}
                        className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.method_name}</p>
                          {p.referencia && (
                            <p className="text-xs text-gray-400 mt-0.5">Ref: {p.referencia}</p>
                          )}
                        </div>
                        <p className="text-sm font-semibold tabular-nums text-gray-900">{fmt(p.monto)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="tabular-nums text-gray-700">{fmt(ticket.subtotal)}</span>
                </div>
                {ticket.descuento_total > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Descuento</span>
                    <span className="tabular-nums text-emerald-600">−{fmt(ticket.descuento_total)}</span>
                  </div>
                )}
                {ticket.impuestos_total > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Impuestos</span>
                    <span className="tabular-nums text-gray-700">{fmt(ticket.impuestos_total)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="tabular-nums text-gray-900">{fmt(ticket.total)}</span>
                </div>
                {ticket.cambio > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cambio entregado</span>
                    <span className="tabular-nums font-semibold text-emerald-600">{fmt(ticket.cambio)}</span>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-200">
          {ticket ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-brand flex-1 py-2.5 rounded-xl text-sm"
              >
                Imprimir
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>

      </div>
    </div>
    </>
  )
}
