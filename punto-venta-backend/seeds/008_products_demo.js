'use strict';

exports.seed = async function (knex) {
  const products = [
    { business_id: 1, sku: 'A-001', nombre: 'Aceite 5W30 1L',       precio_venta: 189.00, costo: 120.00, stock_actual: 24, stock_minimo: 5,  unidad: 'pz' },
    { business_id: 1, sku: 'B-002', nombre: 'Filtro de aceite',      precio_venta: 95.50,  costo: 52.00,  stock_actual: 18, stock_minimo: 3,  unidad: 'pz' },
    { business_id: 1, sku: 'C-003', nombre: 'Anticongelante 4L',     precio_venta: 245.00, costo: 160.00, stock_actual: 10, stock_minimo: 2,  unidad: 'pz' },
    { business_id: 1, sku: 'D-004', nombre: 'Pastillas de freno JG', precio_venta: 320.00, costo: 195.00, stock_actual: 8,  stock_minimo: 2,  unidad: 'jg' },
    { business_id: 1, sku: 'E-005', nombre: 'Limpiaparabrisas 1L',   precio_venta: 45.00,  costo: 22.00,  stock_actual: 30, stock_minimo: 10, unidad: 'pz' },
  ];

  await knex('product').insert(products).onConflict(['business_id', 'sku']).ignore();
};
