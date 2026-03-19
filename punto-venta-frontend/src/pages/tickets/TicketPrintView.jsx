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

/* ── styles (inline to ensure print reliability) ─────────── */

const s = {
  root: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: '12px',
    color: '#111',
    maxWidth: '340px',
    margin: '0 auto',
  },
  center: { textAlign: 'center' },
  bold: { fontWeight: 'bold' },
  divider: { borderTop: '1px dashed #888', margin: '8px 0' },
  row: { display: 'flex', justifyContent: 'space-between', margin: '2px 0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '11px' },
  th: { textAlign: 'left', padding: '2px 0', fontWeight: 'bold', borderBottom: '1px solid #ccc' },
  thRight: { textAlign: 'right', padding: '2px 4px', fontWeight: 'bold', borderBottom: '1px solid #ccc' },
  td: { padding: '3px 0', verticalAlign: 'top' },
  tdRight: { textAlign: 'right', padding: '3px 4px', verticalAlign: 'top' },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '4px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    borderTop: '1px solid #888',
    paddingTop: '4px',
  },
}

/* ── component ───────────────────────────────────────────── */

/**
 * TicketPrintView
 *
 * Renders a receipt-style ticket for browser printing.
 * Hidden on screen (.ticket-print CSS class), visible only at @media print.
 *
 * Props:
 *   ticket    object   — ticket header (from GET /tickets/:id)
 *   items     array    — line items
 *   payments  array    — payment entries
 */
export function TicketPrintView({ ticket, items, payments, headerText, footerText }) {
  return (
    <div className="ticket-print">
      <div style={s.root}>

        {/* ── Header ── */}
        <div style={s.center}>
          <div style={{ ...s.bold, fontSize: '15px' }}>{headerText ?? 'PUNTO DE VENTA'}</div>
          <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>TICKET DE VENTA</div>
          {ticket.folio != null && (
            <div style={{ ...s.bold, fontSize: '14px', marginTop: '4px' }}>
              #{String(ticket.folio).padStart(4, '0')}
            </div>
          )}
        </div>

        <div style={s.divider} />

        {/* ── Dates ── */}
        <div style={{ fontSize: '11px' }}>
          <div>Fecha: {fmtDate(ticket.created_at)}</div>
          {ticket.closed_at && <div>Cerrado: {fmtDate(ticket.closed_at)}</div>}
          <div>Estado: {ticket.estatus}</div>
        </div>

        <div style={s.divider} />

        {/* ── Items ── */}
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Artículo</th>
              <th style={{ ...s.thRight, width: '30px' }}>Cant</th>
              <th style={{ ...s.thRight, width: '60px' }}>P.U.</th>
              <th style={{ ...s.thRight, width: '70px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.item_id}>
                <td style={s.td}>
                  <div>{item.product_nombre_snapshot}</div>
                  <div style={{ fontSize: '10px', color: '#555' }}>{item.product_sku_snapshot}</div>
                </td>
                <td style={s.tdRight}>{Number(item.cantidad)}</td>
                <td style={s.tdRight}>{fmt(item.precio_unitario)}</td>
                <td style={s.tdRight}>{fmt(item.subtotal_linea)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={s.divider} />

        {/* ── Totals ── */}
        <div style={s.row}>
          <span>Subtotal</span>
          <span>{fmt(ticket.subtotal)}</span>
        </div>
        {ticket.descuento_total > 0 && (
          <div style={s.row}>
            <span>Descuento</span>
            <span>-{fmt(ticket.descuento_total)}</span>
          </div>
        )}
        {ticket.impuestos_total > 0 && (
          <div style={s.row}>
            <span>Impuestos</span>
            <span>{fmt(ticket.impuestos_total)}</span>
          </div>
        )}
        <div style={s.totalRow}>
          <span>TOTAL</span>
          <span>{fmt(ticket.total)}</span>
        </div>

        {/* ── Payments ── */}
        {payments.length > 0 && (
          <>
            <div style={s.divider} />
            <div style={{ ...s.bold, marginBottom: '3px' }}>PAGOS:</div>
            {payments.map((p) => (
              <div key={p.payment_id} style={s.row}>
                <span>
                  {p.method_name}
                  {p.referencia ? ` (Ref: ${p.referencia})` : ''}
                </span>
                <span>{fmt(p.monto)}</span>
              </div>
            ))}
            {ticket.cambio > 0 && (
              <div style={{ ...s.row, ...s.bold, marginTop: '4px' }}>
                <span>CAMBIO:</span>
                <span>{fmt(ticket.cambio)}</span>
              </div>
            )}
          </>
        )}

        <div style={s.divider} />

        {/* ── Footer ── */}
        <div style={{ ...s.center, fontSize: '11px', color: '#555' }}>
          {footerText ?? '¡Gracias por su compra!'}
        </div>

      </div>
    </div>
  )
}
