import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login, clearError } from '../redux/slices/authSlice'
import { selectAuth } from '../redux/store'
import { Button } from '../Components/ui/button'
import { Label } from '../Components/ui/label'
import { AuthShell, FormField, EntityTabs, AUTH_ENTITIES, ENTITY_KEYS } from '../Components/auth'
import { getPrimaryEntity } from '@/lib/roles'

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

  const { user, loading, error, accessToken } = useSelector(selectAuth)
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
    <p className="text-sm text-gray-400">
      Don&apos;t have an account?{' '}
      <Button
        variant="link"
        className="text-primary hover:text-primary/80 p-0 h-auto font-semibold"
        onClick={() => navigate('/register')}
      >
        Sign Up
      </Button>
    </p>
  )

  return (
    <AuthShell
      title={entityConfig.login.title}
      description={entityConfig.login.description}
      entityTabs={<EntityTabs active={entity} entities={tabs} onSelect={setEntity} />}
      footer={footer}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {entityConfig.login.fields.map((field) => {
          if (field.name === 'password') {
            const fieldWithoutLabel = { ...field, label: null }
            return (
              <div key={field.name} className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${entity}-${field.name}`} className="text-sm font-medium text-gray-300">
                    {field.label}
                  </Label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
                    onClick={(e) => e.preventDefault()}
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

        {error ? (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : null}

        <Button
          disabled={loading}
          type="submit"
          className="neomorph-button w-full h-11 bg-gray-200 hover:bg-white text-black font-semibold transition-all"
        >
          {loading ? 'Logging in…' : 'Login'}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-700/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#303030] px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        <Button
          variant="outline"
          type="button"
          className="neomorph-button w-full h-11 border-gray-700/50 hover:bg-accent text-gray-300"
        >
          Login with Google
        </Button>
      </form>
    </AuthShell>
  )
}

