import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { requestOtp, verifyAndRegister, clearError, resetOtp } from '../redux/slices/authSlice'
import { selectAuth } from '../redux/store'
import { Button } from '../Components/ui/button'
import { AuthShell, EntityTabs, FormField, OtpVerification, PolicyModal, AUTH_ENTITIES, ENTITY_KEYS } from '../Components/auth'
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

export default function Register() {
  const [entity, setEntity] = useState('student')
  const entityConfig = AUTH_ENTITIES[entity]
  const registerFields = entityConfig.register.fields
  const initialForm = useMemo(() => buildInitialState(registerFields), [registerFields])
  const [form, setForm] = useState(initialForm)
  
  const visibleRegisterFields = useMemo(() => {
    return registerFields.filter((field) => {
      if (!field.when) return true
      const { name, value } = field.when
      return form[name] === value
    })
  }, [registerFields, form])
  
  const [pendingForm, setPendingForm] = useState(null)
  const [otpValue, setOtpValue] = useState('')
  const [step, setStep] = useState('form')
  const [policyModal, setPolicyModal] = useState({ isOpen: false, type: null })

  const { user, loading, error, otp: otpState } = useSelector(selectAuth)
  const { isDark } = useTheme()
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
          <p className={`text-sm sm:text-base transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Already have an account?{' '}
            <button
              type="button"
              className={`font-semibold transition-colors ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              onClick={() => navigate('/login')}
            >
              Log in
            </button>
          </p>
        )

  const otpTarget = otpState.maskedEmail || otpState.email
  const otpHelpText = [entityConfig.register.otpHelp, otpTarget ? `Sent to ${otpTarget}` : null]
    .filter(Boolean)
    .join(' • ')

  return (
    <>
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
        <form onSubmit={onSubmitForm} className="space-y-4 sm:space-y-5">
          {visibleRegisterFields.map((field) => (
            <FormField
              key={field.name}
              entity={entity}
              field={field}
              value={form[field.name] ?? ''}
              onChange={onFieldChange}
            />
          ))}
          
          {error && (
            <div className={`p-3 sm:p-4 rounded-xl border transition-colors duration-300 ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-xs sm:text-sm text-center transition-colors duration-300 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
            </div>
          )}
          
          <div className="pt-2">
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
              {loading ? 'Processing…' : 'Sign up'}
            </Button>
            
            <p className={`text-xs text-center mt-3 sm:mt-4 leading-relaxed px-2 transition-colors duration-300 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              By signing up, you agree to the{' '}
              <button
                type="button"
                onClick={() => setPolicyModal({ isOpen: true, type: 'terms' })}
                className={`hover:underline transition-colors ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setPolicyModal({ isOpen: true, type: 'privacy' })}
                className={`hover:underline transition-colors ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                Privacy Policy
              </button>
              , including{' '}
              <button
                type="button"
                onClick={() => setPolicyModal({ isOpen: true, type: 'cookies' })}
                className={`hover:underline transition-colors ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                Cookie Use
              </button>
              .
            </p>
          </div>
        </form>
      )}
      </AuthShell>
      
      <PolicyModal
        type={policyModal.type}
        isOpen={policyModal.isOpen}
        onClose={() => setPolicyModal({ isOpen: false, type: null })}
      />
    </>
  )
}
