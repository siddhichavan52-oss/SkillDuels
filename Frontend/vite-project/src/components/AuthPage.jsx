import { useState } from 'react'
import { login, register } from './store'
import { Field, Logo } from './ui'
import { Icon } from './Icons'
import { useToast } from './toastContext'
import DuelPreview from './DuelPreview'

export default function AuthPage({ initialMode = 'login', navigate }) {
  const toast = useToast()
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const switchMode = (m) => {
    setMode(m)
    setErrors({})
  }

  const submit = (e) => {
    e.preventDefault()
    const res = mode === 'login' ? login(form) : register(form)
    if (!res.ok) {
      setErrors(res.errors)
      return
    }
    toast(mode === 'login' ? `Welcome back, ${res.user.name.split(' ')[0]}.` : 'Account created. Your first duel is one click away.', 'success')
  }

  const fillDemo = (email, password) => {
    setMode('login')
    setErrors({})
    setForm({ name: '', email, password })
  }

  return (
    <div className="auth">
      <section className="auth-brand" aria-labelledby="brand-title">
        <a href="#/" className="auth-logo" aria-label="SkillDuels home"><Logo size={32} /></a>
        <h1 id="brand-title" className="auth-title">Learn faster by beating a friend.</h1>
        <p className="auth-lead">
          Face another student in a live quiz, race a 15-second clock on every question, and watch your XP climb the leaderboard.
        </p>
        <DuelPreview />
      </section>

      <section className="auth-panel" aria-label="Account">
        <button type="button" className="auth-back" onClick={() => navigate('/')}>
          <Icon name="home" size={16} /> Back to home
        </button>
        <div className="auth-card">
          <div className="tabs" role="tablist" aria-label="Choose how to continue">
            <button type="button" role="tab" id="tab-login" aria-selected={mode === 'login'} aria-controls="auth-form" className="tab" onClick={() => switchMode('login')}>
              Log in
            </button>
            <button type="button" role="tab" id="tab-register" aria-selected={mode === 'register'} aria-controls="auth-form" className="tab" onClick={() => switchMode('register')}>
              Create account
            </button>
          </div>

          <form id="auth-form" role="tabpanel" aria-labelledby={`tab-${mode}`} onSubmit={submit} noValidate>
            <h2 className="auth-heading">{mode === 'login' ? 'Log in to your arena' : 'Join SkillDuels'}</h2>

            {errors.form && (
              <div className="form-alert" role="alert">
                <Icon name="info" size={16} />
                {errors.form}
              </div>
            )}

            {mode === 'register' && (
              <Field label="Your name" error={errors.name}>
                {(p) => <input {...p} type="text" autoComplete="name" value={form.name} onChange={set('name')} placeholder="Ava Sharma" />}
              </Field>
            )}

            <Field label="Email" error={errors.email}>
              {(p) => <input {...p} type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@college.edu" />}
            </Field>

            <Field label="Password" error={errors.password} hint={mode === 'register' ? 'At least 6 characters, with a letter and a number.' : undefined}>
              {(p) => (
                <div className="input-wrap">
                  <input
                    {...p}
                    type={showPw ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={form.password}
                    onChange={set('password')}
                  />
                  <button type="button" className="icon-btn input-btn" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw}>
                    <Icon name={showPw ? 'eyeOff' : 'eye'} size={18} />
                  </button>
                </div>
              )}
            </Field>

            <button type="submit" className="btn btn-primary btn-block">
              {mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <div className="demo">
            <p>Just exploring? Use a demo account.</p>
            <div className="demo-row">
              <button type="button" className="btn btn-small" onClick={() => fillDemo('ava@skillduels.dev', 'Player@123')}>
                <Icon name="user" size={16} /> Player demo
              </button>
              <button type="button" className="btn btn-small" onClick={() => fillDemo('admin@skillduels.dev', 'Admin@123')}>
                <Icon name="settings" size={16} /> Admin demo
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
