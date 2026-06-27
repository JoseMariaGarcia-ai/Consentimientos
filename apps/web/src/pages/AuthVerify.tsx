import { useEffect, useState } from 'react'
import { saveSession } from '@/lib/auth'

const API = import.meta.env.VITE_API_URL ?? ''

export default function AuthVerify() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (!token) { setStatus('error'); setMsg('Token no encontrado en la URL'); return }

    fetch(`${API}/auth/verify?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.token) {
          saveSession(data.token, data.email)
          window.location.href = '/'
        } else {
          setStatus('error')
          setMsg(data.error ?? 'Token inválido o expirado')
        }
      })
      .catch(() => { setStatus('error'); setMsg('Error de conexión') })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-sm w-full">
        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Verificando enlace…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl">✕</span>
            </div>
            <p className="font-semibold text-slate-800">Enlace inválido</p>
            <p className="text-sm text-slate-500 mt-1">{msg}</p>
            <a href="/" className="mt-4 inline-block text-blue-600 text-sm hover:underline">
              Volver al inicio
            </a>
          </>
        )}
      </div>
    </div>
  )
}
