import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Payment() {
  const [searchParams] = useSearchParams()
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [clientKey, setClientKey] = useState('')
  const snapToken = searchParams.get('token')
  const orderId = searchParams.get('order_id')

  useEffect(() => {
    if (!snapToken) {
      toast.error('Token pembayaran tidak ditemukan')
      nav('/checkout')
      return
    }

    // Get client key from localStorage or use default sandbox
    const storedClientKey = localStorage.getItem('midtrans_client_key') || 'SB-Mid-client-xxxxxxxxxxxxx'
    setClientKey(storedClientKey)

    // Determine Midtrans URL (sandbox or production)
    const isSandbox = storedClientKey.includes('SB-Mid-client') || storedClientKey.includes('SB-Mid-server')
    const snapUrl = isSandbox 
      ? 'https://app.sandbox.midtrans.com/snap/snap.js'
      : 'https://app.midtrans.com/snap/snap.js'

    // Load Midtrans Snap script
    const script = document.createElement('script')
    script.src = snapUrl
    script.setAttribute('data-client-key', storedClientKey)
    script.async = true

    script.onload = () => {
      // Wait a bit for snap to be fully loaded
      setTimeout(() => {
        if (window.snap) {
          window.snap.pay(snapToken, {
            onSuccess: function(result) {
              console.log('Payment success:', result)
              toast.success('Pembayaran berhasil!')
              setTimeout(() => {
                nav('/history')
              }, 2000)
            },
            onPending: function(result) {
              console.log('Payment pending:', result)
              toast('Menunggu pembayaran...', { duration: 3000 })
              setTimeout(() => {
                nav('/history')
              }, 2000)
            },
            onError: function(result) {
              console.log('Payment error:', result)
              toast.error('Pembayaran gagal. Silakan coba lagi.')
              setTimeout(() => {
                nav('/checkout')
              }, 2000)
            },
            onClose: function() {
              console.log('Payment closed')
              toast('Pembayaran dibatalkan')
              setTimeout(() => {
                nav('/checkout')
              }, 1000)
            }
          })
          setLoading(false)
        } else {
          toast.error('Gagal memuat halaman pembayaran')
          setLoading(false)
        }
      }, 500)
    }

    script.onerror = () => {
      toast.error('Gagal memuat halaman pembayaran')
      setLoading(false)
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup script if component unmounts
      const existingScript = document.querySelector('script[src*="snap.js"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [snapToken, nav])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat halaman pembayaran...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-primary mb-4">Pembayaran</h2>
        <p className="text-gray-600 mb-4">Memuat halaman pembayaran Midtrans...</p>
        <p className="text-sm text-gray-500">Jika halaman pembayaran tidak muncul, silakan refresh halaman ini.</p>
      </div>
    </div>
  )
}

