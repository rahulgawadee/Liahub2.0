import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login, clearError } from '../redux/slices/authSlice'
import { selectAuth } from '../redux/store'
import { Button } from '../Components/ui/button'
import { Label } from '../Components/ui/label'
import { AuthShell, FormField, EntityTabs, ForgotPasswordModal, AUTH_ENTITIES, ENTITY_KEYS } from '../Components/auth'
import { getPrimaryEntity } from '@/lib/roles'
import { useTheme } from '@/hooks/useTheme'

const ENTITY_ROUTE_MAP = ENTITY_KEYS.reduce((acc, key) => {
  acc[key] = AUTH_ENTITIES[key].dashboardRoute
  return acc
}, {})

const buildInitialState = (fields) => {
  const next = {}
  fields.forEach((field) => {
    if (field.type === 'select') {
      const first = field.options?.[0]
      next[field.name] = typeof first === 'string' ? first.toLowerCase().replace(/\s+/g, '-') : first?.value || ''
    } else {
      next[field.name] = field.defaultValue ?? ''
    }
  })
  return next
}

export default function Login() {
  const [entity, setEntity] = useState('student')
  const entityConfig = AUTH_ENTITIES[entity]
  const loginFields = entityConfig.login.fields
  const initialForm = useMemo(() => buildInitialState(loginFields), [loginFields])
  const [form, setForm] = useState(initialForm)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const { user, loading, error, accessToken } = useSelector(selectAuth)
  const { isDark } = useTheme()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && accessToken) {
      const entityKey = user.entity || getPrimaryEntity(user.roles)
      const destination = ENTITY_ROUTE_MAP[entityKey] || '/profile'
      navigate(destination, { replace: true })
    }
  }, [user, accessToken, navigate])

  useEffect(() => {
    setForm(initialForm)
    dispatch(clearError())
  }, [initialForm, dispatch])

  useEffect(() => () => { dispatch(clearError()) }, [dispatch])

  const onFieldChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = (event) => {
    event.preventDefault()
    dispatch(
      login({
        identifier: form.identifier,
        password: form.password,
        entity,
        subRole: form.subRole,
      })
    )
  }

  const tabs = useMemo(
    () => ENTITY_KEYS.map((key) => ({ key, label: AUTH_ENTITIES[key].label })),
    []
  )

  const footer = (
    <p className={`text-sm sm:text-base transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
      Don&apos;t have an account?{' '}
      <button
        type="button"
        className={`font-semibold transition-colors ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
        onClick={() => navigate('/register')}
      >
        Sign up
      </button>
    </p>
  )

  return (
    <>
    <AuthShell
      title={entityConfig.login.title}
      description={entityConfig.login.description}
      entityTabs={<EntityTabs active={entity} entities={tabs} onSelect={setEntity} />}
      footer={footer}
    >
      <form onSubmit={onSubmit} className="space-y-5 sm:space-y-6">
        {entityConfig.login.fields.map((field) => {
          if (field.name === 'password') {
            const fieldWithoutLabel = { ...field, label: null }
            return (
              <div key={field.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${entity}-${field.name}`} className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {field.label}
                  </Label>
                  <button
                    type="button"
                    className={`text-xs sm:text-sm transition-colors ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </button>
                </div>
                <FormField
                  entity={entity}
                  field={fieldWithoutLabel}
                  value={form[field.name] ?? ''}
                  onChange={onFieldChange}
                />
              </div>
            )
          }

          return (
            <FormField
              key={field.name}
              entity={entity}
              field={field}
              value={form[field.name] ?? ''}
              onChange={onFieldChange}
            />
          )
        })}

        {error && (
          <div className={`p-3 sm:p-4 rounded-xl border transition-colors duration-300 ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-xs sm:text-sm text-center transition-colors duration-300 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          </div>
        )}

        <Button
          disabled={loading}
          type="submit"
          style={{
            backgroundColor: isDark ? 'white' : 'black',
            color: isDark ? 'black' : 'white'
          }}
          className="w-full h-12 sm:h-14 font-bold text-sm sm:text-base rounded-full transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? '#f3f4f6' : '#1f2937'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? 'white' : 'black'
          }}
        >
          {loading ? 'Logging in…' : 'Login'}
        </Button>
      </form>
    </AuthShell>
    
    <ForgotPasswordModal
      isOpen={showForgotPassword}
      onClose={() => setShowForgotPassword(false)}
    />
    </>
  )
}

