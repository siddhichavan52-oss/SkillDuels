import { useEffect, useId, useRef } from 'react'
import { Icon } from './Icons'
import { tierFor } from './data'
import { initials } from './utils'

export function Logo({ size = 30 }) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <rect x="12" y="12" width="18" height="18" rx="5" fill="var(--foe)" stroke="var(--ink)" strokeWidth="2" />
        <rect x="2" y="2" width="18" height="18" rx="5" fill="var(--you)" stroke="var(--ink)" strokeWidth="2" />
      </svg>
      <span className="logo-word">SkillDuels</span>
    </span>
  )
}

export function Avatar({ name, color, size = 40 }) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: color || 'var(--gold)', fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

export function TierChip({ xp, tier }) {
  const t = tier || tierFor(xp)
  return (
    <span className="tier-chip" style={{ '--tier': t.color }}>
      <Icon name="crown" size={13} />
      {t.name}
    </span>
  )
}

export function ProgressBar({ pct, label, tone = 'you' }) {
  return (
    <div
      className={`progress progress-${tone}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
    >
      <span style={{ width: `${pct}%` }} />
    </div>
  )
}

export function PageHeader({ title, children, action }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {children && <p className="page-sub">{children}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon = 'info', title, children, action }) {
  return (
    <div className="empty">
      <span className="empty-icon"><Icon name={icon} size={26} /></span>
      <strong>{title}</strong>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

// Label + input wrapper. `children` is a render function that receives the a11y props.
export function Field({ label, error, hint, children }) {
  const id = useId()
  const describedBy = [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {hint && !error && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="field-error" id={`${id}-err`}><Icon name="info" size={14} />{error}</p>}
    </div>
  )
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

// Accessible dialog: focus moves in, Tab is trapped, Escape closes, focus returns on close.
export function Modal({ title, onClose, children, footer, wide }) {
  const ref = useRef(null)
  const titleId = useId()
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const previous = document.activeElement
    const el = ref.current
    const first = el.querySelector('input,select,textarea') || el.querySelector('button:not(.modal-x)') || el
    first.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
      }
      if (e.key === 'Tab') {
        const items = [...el.querySelectorAll(FOCUSABLE)]
        if (!items.length) return
        const a = items[0]
        const b = items[items.length - 1]
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault()
          b.focus()
        } else if (!e.shiftKey && document.activeElement === b) {
          e.preventDefault()
          a.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [])

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1}>
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn modal-x" onClick={onClose} aria-label="Close dialog">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ title, message, confirmLabel, cancelLabel = 'Cancel', danger, onConfirm, onCancel }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="confirm-text">{message}</p>
    </Modal>
  )
}
