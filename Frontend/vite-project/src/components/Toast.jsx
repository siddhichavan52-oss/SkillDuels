import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext } from './toastContext'
import { Icon } from './Icons'

// Gives visible, announced feedback for every user action (NFR-05).
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback(
    (message, tone = 'info') => {
      const id = ++counter.current
      setToasts((t) => [...t.slice(-3), { id, message, tone }])
      setTimeout(() => dismiss(id), 4200)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ push }), [push])
  const icons = { success: 'check', error: 'x', info: 'info' }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            <Icon name={icons[t.tone]} size={18} />
            <span>{t.message}</span>
            <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss message">
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
