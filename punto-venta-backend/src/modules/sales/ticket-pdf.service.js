'use strict';

const { chromium } = require('playwright');
const printService = require('./ticket-print.service');
const printRepo = require('./ticket-print.repository');

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

  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdfBuffer = await page.pdf({
      printBackground: true,
      width: widthMm,
      // height is auto (page grows to fit content)
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
    return pdfBuffer;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

module.exports = { generateTicketPdf };
