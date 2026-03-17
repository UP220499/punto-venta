import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { useCreateUser } from '../../features/users/useCreateUser'
import { updateUser, setUserRoles } from '../../features/users/usersApi'

/* ── constants ──────────────────────────────────────────── */

// Known role codes — update if backend adds new roles
const ROLE_OPTIONS = [
  { code: 'ADMIN',      label: 'Administrador' },
  { code: 'CAJERO',     label: 'Cajero' },
  { code: 'INVENTARIO', label: 'Inventario' },
]

/* ── schemas ────────────────────────────────────────────── */

const createSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Mínimo 3 caracteres')
    .max(40, 'Máximo 40 caracteres')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Solo letras, números, punto, guion y guion bajo'),
  nombre: z.string().trim().min(2, 'Mínimo 2 caracteres').max(120, 'Máximo 120 caracteres'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72, 'Máximo 72 caracteres'),
  role_codes: z.array(z.string()).min(1, 'Selecciona al menos un rol'),
})

const editSchema = z.object({
  nombre: z.string().trim().min(2, 'Mínimo 2 caracteres').max(120, 'Máximo 120 caracteres'),
  activo: z.boolean(),
  role_codes: z.array(z.string()).min(1, 'Selecciona al menos un rol'),
})

/* ── helpers ────────────────────────────────────────────── */

function inputCls(hasError) {
  return `w-full px-3.5 py-2.5 rounded-lg border text-sm bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`
}

function FieldError({ msg }) {
  return <p className="mt-1 text-xs text-red-500">{msg}</p>
}

function extractError(err) {
  if (!err) return null
  return err.response?.data?.message ?? err.message ?? 'Error desconocido'
}

/* ── component ──────────────────────────────────────────── */

export function UserFormModal({ isOpen, user, onClose }) {
  const isEdit = user != null
  const qc = useQueryClient()

  const { mutate: doCreate, isPending: creating, error: createErr } = useCreateUser()

  const [editPending, setEditPending] = useState(false)
  const [editError, setEditError] = useState(null)

  const isPending = creating || editPending
  const serverError = extractError(createErr) ?? editError

  const schema = isEdit ? editSchema : createSchema
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const roleCodes = watch('role_codes') ?? []
  const isActivo = watch('activo')

  function toggleRole(code) {
    const next = roleCodes.includes(code)
      ? roleCodes.filter((c) => c !== code)
      : [...roleCodes, code]
    setValue('role_codes', next, { shouldValidate: true })
  }

  useEffect(() => {
    if (!isOpen) return
    setEditError(null)
    if (isEdit) {
      reset({
        nombre:     user.nombre,
        activo:     user.activo,
        role_codes: user.roles ?? [],
      })
    } else {
      reset({ username: '', nombre: '', password: '', role_codes: [] })
    }
  }, [isOpen, isEdit, user, reset])

  function onSubmit(formData) {
    if (isEdit) {
      setEditPending(true)
      setEditError(null)
      Promise.all([
        updateUser(user.user_id, { nombre: formData.nombre, activo: formData.activo }),
        setUserRoles(user.user_id, formData.role_codes),
      ])
        .then(() => {
          qc.invalidateQueries({ queryKey: ['users'] })
          onClose()
        })
        .catch((err) => setEditError(extractError(err)))
        .finally(() => setEditPending(false))
    } else {
      doCreate(
        {
          username:   formData.username,
          nombre:     formData.nombre,
          password:   formData.password,
          role_codes: formData.role_codes,
        },
        { onSuccess: onClose },
      )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={!isPending ? onClose : undefined} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md my-8">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEdit ? `@${user.username}` : 'Completa los datos del nuevo usuario'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 ml-4 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="px-6 py-5 space-y-4">

            {/* Username — create only */}
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre de usuario <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. jperez"
                  autoComplete="username"
                  {...register('username')}
                  className={inputCls(errors.username)}
                />
                {errors.username && <FieldError msg={errors.username.message} />}
              </div>
            )}

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                {...register('nombre')}
                className={inputCls(errors.nombre)}
              />
              {errors.nombre && <FieldError msg={errors.nombre.message} />}
            </div>

            {/* Password — create only */}
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  {...register('password')}
                  className={inputCls(errors.password)}
                />
                {errors.password && <FieldError msg={errors.password.message} />}
              </div>
            )}

            {/* Activo toggle — edit only */}
            {isEdit && (
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Estado</p>
                  <p className="text-xs text-gray-400 mt-0.5">Desactivar bloquea el acceso</p>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  {/* Toggle switch — input, track, and knob are siblings inside the wrapper */}
                  <div className="relative w-10 h-6">
                    <input
                      type="checkbox"
                      {...register('activo')}
                      className="sr-only peer"
                    />
                    <div className="absolute inset-0 rounded-full bg-gray-200 transition-colors peer-checked:bg-indigo-600" />
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm text-gray-600 min-w-[4.5rem]">
                    {isActivo ? 'Activo' : 'Bloqueado'}
                  </span>
                </label>
              </div>
            )}

            {/* Roles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Roles <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {ROLE_OPTIONS.map((opt) => (
                  <label
                    key={opt.code}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={roleCodes.includes(opt.code)}
                      onChange={() => toggleRole(opt.code)}
                      className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-400">{opt.code}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.role_codes && <FieldError msg={errors.role_codes.message} />}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg">
                <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-600">{serverError}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isPending && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
