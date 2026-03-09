'use strict';

const repo = require('./ticket-print.repository');

/* ── Helpers ── */

function appError(code, message, statusCode) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  return err;
}

/** Basic XSS escape for inline HTML content */
function esc(val) {
  if (val == null) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escape and convert newlines to <br> for multi-line text blocks */
function escPre(val) {
  return esc(val).replace(/\n/g, '<br>');
}

/** Format a decimal value as currency string */
function formatMoney(val, symbol, decimals) {
  return esc(symbol) + Number(val).toFixed(decimals);
}

/** Format quantity: strip trailing zeros up to 3 decimal places */
function formatQty(val) {
  return parseFloat(Number(val).toFixed(3)).toString();
}

/** Format a timestamp to "YYYY-MM-DD HH:MM" (server local time) */
function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** Build folio display string */
function formatFolio(folio, prefix, padding) {
  if (folio == null) return 'SIN FOLIO';
  const p = esc(prefix || '');
  const padLen = Number(padding) || 6;
  return p + String(Number(folio)).padStart(padLen, '0');
}

/* ── HTML renderer ── */

function renderHtml(ticket, items, payments, cashier, s) {
  const sym = s.currency_symbol || '$';
  const dec = Number(s.decimal_places) || 2;
  const paperWidth = s.ticket_paper_width === 80 ? '80mm' : '58mm';
  const isDraft = ticket.estatus === 'BORRADOR';

  const displayDate = formatDate(ticket.closed_at || ticket.created_at);
  const folio = formatFolio(ticket.folio, s.ticket_folio_prefix, s.ticket_folio_padding);

  /* Header block */
  const headerHtml = s.ticket_header_text
    ? `<div class="pre-text">${escPre(s.ticket_header_text)}</div><hr class="sep">`
    : '';

  /* Cashier line */
  const cashierHtml =
    s.show_cashier_name && cashier
      ? `<div>Cajero: ${esc(cashier.nombre || cashier.username)}</div>`
      : '';

  /* Draft watermark */
  const draftHtml = isDraft
    ? '<div class="watermark">BORRADOR</div>'
    : '';

  /* Items rows — name line + qty × price + subtotal line */
  const itemsHtml = items
    .map((item) => {
      const qty = formatQty(item.cantidad);
      const price = formatMoney(item.precio_unitario, sym, dec);
      const sub = formatMoney(item.subtotal_linea, sym, dec);
      const name = esc(item.product_nombre_snapshot);
      return `<tr>
          <td colspan="2" class="item-name">${name}</td>
        </tr>
        <tr>
          <td class="item-qty">${esc(qty)} x ${price}</td>
          <td class="td-right">${sub}</td>
        </tr>`;
    })
    .join('');

  /* Totals */
  const subtotalFmt = formatMoney(ticket.subtotal, sym, dec);
  const totalFmt = formatMoney(ticket.total, sym, dec);
  const cambioFmt = formatMoney(ticket.cambio, sym, dec);

  const discountHtml =
    Number(ticket.descuento_total) > 0
      ? `<tr>
          <td>Descuento:</td>
          <td class="td-right">-${formatMoney(ticket.descuento_total, sym, dec)}</td>
        </tr>`
      : '';

  const taxHtml =
    s.tax_enabled && s.show_tax_breakdown
      ? `<tr>
          <td>Impuestos:</td>
          <td class="td-right">${formatMoney(ticket.impuestos_total, sym, dec)}</td>
        </tr>`
      : '';

  /* Payments */
  const paymentsHtml = payments
    .map((p) => {
      const ref = p.referencia
        ? ` <span class="ref">(${esc(p.referencia)})</span>`
        : '';
      return `<tr>
          <td>${esc(p.nombre_visible)}${ref}:</td>
          <td class="td-right">${formatMoney(p.monto, sym, dec)}</td>
        </tr>`;
    })
    .join('');

  /* Footer block */
  const footerHtml = s.ticket_footer_text
    ? `<hr class="sep"><div class="pre-text footer-text">${escPre(s.ticket_footer_text)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket ${folio}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      width: ${paperWidth};
      margin: 0 auto;
      padding: 4mm 3mm;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .td-right { text-align: right; white-space: nowrap; }
    .sep { border: none; border-top: 1px dashed #000; margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { vertical-align: top; padding: 1px 0; }
    .item-name { font-weight: bold; padding-top: 5px; }
    .item-qty { color: #444; }
    .total-row td { font-weight: bold; border-top: 1px solid #000; padding-top: 3px; }
    .folio { font-size: 14px; font-weight: bold; }
    .watermark {
      text-align: center;
      font-size: 13px;
      font-weight: bold;
      border: 2px solid #000;
      padding: 3px 6px;
      margin: 5px 0;
      letter-spacing: 6px;
    }
    .pre-text { white-space: pre-wrap; text-align: center; }
    .footer-text { font-size: 11px; margin-top: 4px; }
    .ref { font-size: 10px; color: #555; }
    @media print {
      body { width: ${paperWidth}; margin: 0; padding: 2mm 2mm; }
      @page { margin: 0; size: ${paperWidth} auto; }
    }
  </style>
</head>
<body>

  ${headerHtml}

  <div class="center">
    <div class="folio">Folio: ${folio}</div>
    <div>${esc(displayDate)}</div>
    ${cashierHtml}
  </div>

  ${draftHtml}

  <hr class="sep">

  <table>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <hr class="sep">

  <table>
    <tbody>
      <tr>
        <td>Subtotal:</td>
        <td class="td-right">${subtotalFmt}</td>
      </tr>
      ${discountHtml}
      ${taxHtml}
      <tr class="total-row">
        <td>TOTAL:</td>
        <td class="td-right">${totalFmt}</td>
      </tr>
    </tbody>
  </table>

  <hr class="sep">

  <table>
    <tbody>
      ${paymentsHtml}
      <tr>
        <td>Cambio:</td>
        <td class="td-right">${cambioFmt}</td>
      </tr>
    </tbody>
  </table>

  ${footerHtml}

</body>
</html>`;
}

/* ── Public API ── */

async function renderTicketHtml(ticketId, businessId) {
  // Load settings and ticket in parallel
  const [settings, ticket] = await Promise.all([
    repo.getSettings(businessId),
    repo.getTicket(ticketId, businessId),
  ]);

  if (!ticket) {
    throw appError('TICKET_NOT_FOUND', 'Ticket not found', 404);
  }

  const s = settings || {};

  // Load items, payments, and optionally cashier in parallel
  const [items, payments, cashier] = await Promise.all([
    repo.getItems(ticketId),
    repo.getPayments(ticketId),
    s.show_cashier_name ? repo.getCashier(ticket.created_by) : Promise.resolve(null),
  ]);

  return renderHtml(ticket, items, payments, cashier, s);
}

module.exports = { renderTicketHtml };
