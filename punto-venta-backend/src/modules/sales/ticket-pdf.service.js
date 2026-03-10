'use strict';

const { chromium, errors } = require('playwright');
const printService = require('./ticket-print.service');
const printRepo = require('./ticket-print.repository');

function appError(code, message, statusCode) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  return err;
}

function isTimeoutError(err) {
  return err instanceof errors.TimeoutError || (err && typeof err.message === 'string' && err.message.includes('Timeout'));
}

/**
 * Generate a PDF buffer for the given ticket.
 * Reuses the HTML renderer from ticket-print.service.js.
 * Loads settings separately (needed for paper width in page.pdf()).
 *
 * @param {number} ticketId
 * @param {number} businessId
 * @returns {Promise<Buffer>}
 */
async function generateTicketPdf(ticketId, businessId) {
  // Fetch HTML and settings in parallel.
  // renderTicketHtml throws TICKET_NOT_FOUND (404) if ticket doesn't exist.
  const [html, settings] = await Promise.all([
    printService.renderTicketHtml(ticketId, businessId),
    printRepo.getSettings(businessId),
  ]);

  const widthMm = (settings && settings.ticket_paper_width === 80) ? '80mm' : '58mm';
  const timeoutMs = Number(process.env.PDF_RENDER_TIMEOUT_MS || 15000);

  let browser;
  let context;
  let page;
  try {
    browser = await chromium.launch({ timeout: timeoutMs });
    context = await browser.newContext();
    context.setDefaultTimeout(timeoutMs);

    page = await context.newPage();
    page.setDefaultTimeout(timeoutMs);

    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    const pdfBuffer = await page.pdf({
      printBackground: true,
      width: widthMm,
      timeout: timeoutMs,
      // height is auto (page grows to fit content)
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });

    return pdfBuffer;
  } catch (err) {
    if (err && err.statusCode) throw err;
    if (isTimeoutError(err)) {
      throw appError('PDF_TIMEOUT', 'PDF generation timed out', 504);
    }
    throw appError('PDF_RENDER_FAILED', 'Failed to generate PDF', 500);
  } finally {
    if (page) {
      try { await page.close(); } catch (_err) {}
    }
    if (context) {
      try { await context.close(); } catch (_err) {}
    }
    if (browser) {
      try { await browser.close(); } catch (_err) {}
    }
  }
}

module.exports = { generateTicketPdf };
