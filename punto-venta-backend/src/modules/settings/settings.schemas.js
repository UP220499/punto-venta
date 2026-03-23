'use strict';

const { z } = require('zod');

function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues.map((i) => i.message).join('; ');
    const err = new Error(msg);
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  return result.data;
}

// All PATCH-allowed fields — strict() rejects unknown keys
const patchSettingsBody = z
  .object({
    ticket_folio_prefix:        z.string().max(20).nullable().optional(),
    ticket_folio_next:          z.number().int().min(1).optional(),
    ticket_folio_padding:       z.number().int().min(0).max(12).optional(),
    tax_enabled:                z.boolean().optional(),
    tax_rate:                   z.number().min(0).max(1).optional(),
    tax_included_in_price:      z.boolean().optional(),
    currency_code:              z.string().length(3).optional(),
    currency_symbol:            z.string().max(5).optional(),
    decimal_places:             z.number().int().min(0).max(4).optional(),
    timezone:                   z.string().max(64).optional(),
    ticket_header_text:         z.string().max(500).nullable().optional(),
    ticket_footer_text:         z.string().max(500).nullable().optional(),
    ticket_paper_width:         z.literal(58).or(z.literal(80)).optional(),
    show_tax_breakdown:         z.boolean().optional(),
    show_cashier_name:          z.boolean().optional(),
    show_barcode_on_ticket:     z.boolean().optional(),
    default_stock_minimo:       z.number().int().min(0).optional(),
    default_unidad:             z.string().max(16).optional(),
    require_transfer_reference: z.boolean().optional(),
    // Branding
    business_name:       z.string().min(1).max(100).optional(),
    business_subtitle:   z.string().max(200).nullable().optional(),
    brand_logo_url:      z.string().max(500).nullable().optional(),
    brand_primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
    brand_surface_dark:  z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  })
  .strict(); // rejects any unknown key with a 400

module.exports = { parse, patchSettingsBody };
