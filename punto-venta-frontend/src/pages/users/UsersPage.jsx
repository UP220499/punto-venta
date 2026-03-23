import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { usePermission, PERMISSIONS } from '../../lib/permissions'
import { useUsers } from '../../features/users/useUsers'
import { useUpdateUser } from '../../features/users/useUpdateUser'
import { UserFormModal } from './UserFormModal'

/* ── formatters ─────────────────────────────────────────── */

const dateFmt = new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' })
function fmtDate(iso) {
  if (!iso) return '—'
  return dateFmt.format(new Date(iso))
}

/* ── role badge ─────────────────────────────────────────── */

const ROLE_COLORS = {
  ADMIN:      'bg-indigo-100 text-indigo-700',
  CAJERO:     'bg-emerald-100 text-emerald-700',
  INVENTARIO: 'bg-amber-100 text-amber-700',
}

function RoleBadge({ code }) {
  const cls = ROLE_COLORS[code] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {code}
    </span>
  )
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

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  )
}

/* ── empty state ────────────────────────────────────────── */

function EmptyState({ hasFilters, onNew, canWrite }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      </div>
      {hasFilters ? (
        <p className="text-sm text-gray-500">No se encontraron usuarios con esos filtros.</p>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-700">No hay usuarios registrados</p>
          {canWrite && (
            <button
              type="button"
              onClick={onNew}
              className="btn-brand mt-1 px-4 py-2 rounded-lg text-sm"
            >
              Agregar primer usuario
            </button>
          )}
        </>
      )}
    </div>
  )
}

/* ── main page ───────────────────────────────────────────── */

const PAGE_SIZE = 20

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const canWrite = usePermission(PERMISSIONS.USER_WRITE)

  const [search, setSearch]               = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activoFilter, setActivoFilter]   = useState('')   // '' | 'true' | 'false'
  const [page, setPage]                   = useState(1)

  const [modalOpen, setModalOpen]     = useState(false)
  const [editingUser, setEditingUser] = useState(null)   // null = create

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading, isError } = useUsers({
    page,
    pageSize: PAGE_SIZE,
    q:        debouncedSearch,
    activo:   activoFilter,
  })

  const { mutate: doToggle } = useUpdateUser()

  const users       = data?.items ?? []
  const total       = data?.total ?? 0
  const totalPages  = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasFilters  = debouncedSearch !== '' || activoFilter !== ''

  function openCreate() {
    setEditingUser(null)
    setModalOpen(true)
  }

  function openEdit(u) {
    setEditingUser(u)
    setModalOpen(true)
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingUser(null)
  }

  function handleToggleActivo(u) {
    doToggle({ userId: u.user_id, activo: !u.activo })
  }

  function clearFilters() {
    setSearch('')
    setDebouncedSearch('')
    setActivoFilter('')
    setPage(1)
  }

  function isSelf(u) {
    return String(currentUser?.sub) === String(u.user_id)
  }

  return (
    <>
      <div className="flex flex-col h-full">

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-white">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Usuarios</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {total > 0 ? `${total} usuario${total !== 1 ? 's' : ''}` : 'Gestiona el acceso al sistema'}
            </p>
          </div>
          {canWrite && (
            <button
              type="button"
              onClick={openCreate}
              className="btn-brand flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nuevo usuario
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white">
          <div className="relative flex-1 max-w-xs">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre o usuario…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-gray-300 text-sm bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[--brand] focus:border-transparent transition"
            />
          </div>

          <select
            value={activoFilter}
            onChange={(e) => { setActivoFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[--brand] focus:border-transparent transition"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Bloqueados</option>
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
              <IconSpinner />
              <span className="text-sm">Cargando usuarios…</span>
            </div>
          )}

          {isError && (
            <p className="text-center text-sm text-red-500 py-16">
              Error al cargar usuarios. Intenta de nuevo.
            </p>
          )}

          {!isLoading && !isError && users.length === 0 && (
            <EmptyState hasFilters={hasFilters} onNew={openCreate} canWrite={canWrite} />
          )}

          {!isLoading && !isError && users.length > 0 && (
            <div className="px-6 py-4">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Roles
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Último acceso
                      </th>
                      {canWrite && (
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {users.map((u) => (
                      <tr key={u.user_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-900">{u.nombre}</p>
                          <p className="text-xs text-gray-400 mt-0.5">@{u.username}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(u.roles ?? []).length > 0
                              ? u.roles.map((r) => <RoleBadge key={r} code={r} />)
                              : <span className="text-xs text-gray-400">Sin roles</span>
                            }
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {u.activo ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              Bloqueado
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {fmtDate(u.last_login_at)}
                        </td>
                        {canWrite && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Toggle activo — hidden on own account */}
                              {!isSelf(u) && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleActivo(u)}
                                  title={u.activo ? 'Bloquear usuario' : 'Activar usuario'}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    u.activo
                                      ? 'text-red-600 hover:bg-red-50'
                                      : 'text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                >
                                  {u.activo ? 'Bloquear' : 'Activar'}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openEdit(u)}
                                title="Editar usuario"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-[--brand] hover:bg-[--brand]/10 transition-colors"
                              >
                                <IconEdit />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                  <span>
                    Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1.5 text-sm font-medium">
                      {page} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <UserFormModal
        isOpen={modalOpen}
        user={editingUser}
        onClose={handleCloseModal}
      />
    </>
  )
}
