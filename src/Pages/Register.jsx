import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { requestOtp, verifyAndRegister, clearError, resetOtp } from '../redux/slices/authSlice'
import { selectAuth } from '../redux/store'
import { Button } from '../Components/ui/button'
import { AuthShell, EntityTabs, FormField, OtpVerification, AUTH_ENTITIES, ENTITY_KEYS } from '../Components/auth'
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

export default function Register() {
  const [entity, setEntity] = useState('student')
  const entityConfig = AUTH_ENTITIES[entity]
  const registerFields = entityConfig.register.fields
  const initialForm = useMemo(() => buildInitialState(registerFields), [registerFields])
    const visibleRegisterFields = useMemo(() => {
      return registerFields.filter((field) => {
        if (!field.when) return true
        const { name, value } = field.when
        return form[name] === value
      })
    }, [registerFields, form])
  const [form, setForm] = useState(initialForm)
  const [pendingForm, setPendingForm] = useState(null)
  const [otpValue, setOtpValue] = useState('')
  const [step, setStep] = useState('form')

  const { user, loading, error, otp: otpState } = useSelector(selectAuth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const tabs = useMemo(
    () => ENTITY_KEYS.map((key) => ({ key, label: AUTH_ENTITIES[key].label })),
    []
  )

  useEffect(() => {
    if (user?.entity) {
      const destination = ENTITY_ROUTE_MAP[user.entity] || '/profile'
      navigate(destination, { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    setForm(initialForm)
    setPendingForm(null)
    setOtpValue('')
    setStep('form')
    dispatch(resetOtp())
    dispatch(clearError())
  }, [initialForm, dispatch])

  useEffect(() => {
    if (otpState.requested) {
      setStep('otp')
    } else if (otpState.status === 'idle') {
      setStep('form')
    }
  }, [otpState])

  useEffect(() => () => {
    dispatch(resetOtp())
    dispatch(clearError())
  }, [dispatch])

  const onFieldChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const buildVisibleFormPayload = useCallback(() => {
    const allowedNames = new Set(visibleRegisterFields.map((field) => field.name))
    return Object.keys(form).reduce((acc, key) => {
      if (allowedNames.has(key)) {
        acc[key] = form[key]
      }
      return acc
    }, {})
  }, [form, visibleRegisterFields])

  const onSubmitForm = (event) => {
    event.preventDefault()
    const payload = buildVisibleFormPayload()
    setPendingForm(payload)
    dispatch(requestOtp({ entity, form: payload }))
  }

  const onVerify = (event) => {
    event.preventDefault()
    if (!pendingForm) return
    dispatch(verifyAndRegister({ entity, form: pendingForm, otp: otpValue }))
      .unwrap()
      .then((payload) => {
        const derivedEntity = payload?.user?.entity || getPrimaryEntity(payload?.user?.roles)
        const destination = ENTITY_ROUTE_MAP[derivedEntity] || '/profile'
        navigate(destination, { replace: true })
      })
      .catch(() => {})
  }

  const onResend = () => {
    const email = pendingForm?.email || form.email
    if (!email) return
    const payload = { ...(pendingForm || form) }
    dispatch(requestOtp({ entity, form: payload }))
  }

  const footer =
    step === 'otp'
      ? null
      : (
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Button
              variant="link"
              className="text-primary hover:text-primary/80 p-0 h-auto font-semibold"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          </p>
        )

  const otpTarget = otpState.maskedEmail || otpState.email
  const otpHelpText = [entityConfig.register.otpHelp, otpTarget ? `Sent to ${otpTarget}` : null]
    .filter(Boolean)
    .join(' • ')

  return (
    <AuthShell
      title={step === 'otp' ? 'Verify Your Email' : entityConfig.register.title}
      description={step === 'otp' ? 'Enter the OTP to activate your workspace.' : entityConfig.register.description}
      entityTabs={<EntityTabs active={entity} entities={tabs} onSelect={setEntity} disabled={step === 'otp'} />}
      footer={footer}
    >
      {step === 'otp' ? (
        <OtpVerification
          otp={otpValue}
          onOtpChange={setOtpValue}
          onSubmit={onVerify}
          onResend={onResend}
          loading={loading}
          error={error}
          helpText={otpHelpText}
          canSubmit={otpValue.length === 6}
        />
      ) : (
        <form onSubmit={onSubmitForm} className="space-y-4">
          {visibleRegisterFields.map((field) => (
            <FormField
              key={field.name}
              entity={entity}
              field={field}
              value={form[field.name] ?? ''}
              onChange={onFieldChange}
            />
          ))}
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
            {loading ? 'Processing…' : 'SignUp'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
