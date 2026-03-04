'use strict';

exports.seed = async function (knex) {
  // Resolve product IDs by SKU
  const products = await knex('product')
    .where('business_id', 1)
    .whereIn('sku', ['A-001', 'B-002', 'C-003', 'D-004', 'E-005'])
    .select('product_id', 'sku');

  const skuMap = Object.fromEntries(products.map((p) => [p.sku, p.product_id]));

  // Primary barcode for each product + one secondary for A-001
  const barcodes = [
    { business_id: 1, product_id: skuMap['A-001'], barcode_value: '7501000111001', is_primary: true },
    { business_id: 1, product_id: skuMap['A-001'], barcode_value: '7501000111999', is_primary: false },
    { business_id: 1, product_id: skuMap['B-002'], barcode_value: '7501000222002', is_primary: true },
    { business_id: 1, product_id: skuMap['C-003'], barcode_value: '7501000333003', is_primary: true },
    { business_id: 1, product_id: skuMap['D-004'], barcode_value: '7501000444004', is_primary: true },
    { business_id: 1, product_id: skuMap['E-005'], barcode_value: '7501000555005', is_primary: true },
  ];

  await knex('product_barcode')
    .insert(barcodes)
    .onConflict(['business_id', 'barcode_value'])
    .ignore();
};
