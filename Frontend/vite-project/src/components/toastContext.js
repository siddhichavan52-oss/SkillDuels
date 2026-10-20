import { createContext, useContext } from 'react'

export const ToastContext = createContext({ push: () => {} })

// const toast = useToast(); toast('Saved', 'success')  (tone: success | error | info)
export const useToast = () => useContext(ToastContext).push
