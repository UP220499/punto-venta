import { useState, useMemo } from 'react'

/**
 * Manages local cart state for the current sale.
 * All item changes are local; the backend is only called on checkout (next phase).
 *
 * Cart item shape:
 *   { product_id, nombre, sku, precio_unitario, stock_actual, cantidad }
 *
 * Return codes from addItem / setQuantity:
 *   null            → success
 *   'STOCK_EXCEEDED'→ requested qty would exceed available stock
 *   'REMOVED'       → qty <= 0, item was removed from cart
 */
export function useTicket() {
  const [items, setItems] = useState([])

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.precio_unitario * i.cantidad, 0),
    [items],
  )

  /**
   * Adds a product to the cart or increments its quantity by 1.
   * Returns null on success, 'STOCK_EXCEEDED' if qty + 1 > stock_actual.
   */
  function addItem(product) {
    const existing = items.find((i) => i.product_id === product.product_id)
    const currentQty = existing?.cantidad ?? 0
    if (currentQty + 1 > product.stock_actual) {
      return 'STOCK_EXCEEDED'
    }
    setItems((prev) => {
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.product_id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i,
        )
      }
      return [
        ...prev,
        {
          product_id: product.product_id,
          nombre: product.nombre,
          sku: product.sku,
          precio_unitario: Number(product.precio_venta),
          stock_actual: Number(product.stock_actual),
          cantidad: 1,
        },
      ]
    })
    return null
  }

  /**
   * Sets an item's quantity explicitly.
   * Returns null on success, 'STOCK_EXCEEDED' if newQty > stock_actual,
   * or 'REMOVED' if newQty <= 0.
   */
  function setQuantity(productId, newQty) {
    const item = items.find((i) => i.product_id === productId)
    if (!item) return null
    if (newQty <= 0) {
      setItems((prev) => prev.filter((i) => i.product_id !== productId))
      return 'REMOVED'
    }
    if (newQty > item.stock_actual) {
      return 'STOCK_EXCEEDED'
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId ? { ...i, cantidad: newQty } : i,
      ),
    )
    return null
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }

  function clearTicket() {
    setItems([])
  }

  return {
    items,
    subtotal,
    total: subtotal,      // impuestos = 0 in this phase; backend calculates on close
    itemCount: items.length,
    addItem,
    setQuantity,
    removeItem,
    clearTicket,
  }
}
