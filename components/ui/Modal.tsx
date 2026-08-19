import React from 'react'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-lg bg-slate-900 border border-slate-800 p-6">
        {title && <h3 className="mb-4 text-lg font-semibold">{title}</h3>}
        <div>{children}</div>
      </div>
    </div>
  )
}
