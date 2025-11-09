import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import API from '../api/api'

const profileSchema = yup.object().shape({
  phone: yup.string().matches(/^[0-9+\-\s()]*$/, 'Format nomor HP tidak valid'),
  address: yup.string(),
  postal_code: yup.string().matches(/^[0-9]*$/, 'Kode pos harus berupa angka'),
})

export default function Profile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(profileSchema)
  })

  useEffect(() => {
    API.get('/auth/profile/')
      .then(res => {
        reset(res.data)
        setLoading(false)
      })
      .catch(() => {
        toast.error('Gagal memuat profil')
        setLoading(false)
      })
  }, [reset])

  const onSubmit = async (data) => {
    setSaving(true)
    const loadingToast = toast.loading('Menyimpan profil...')
    
    try {
      await API.put('/auth/profile/', data)
      toast.dismiss(loadingToast)
      toast.success('Profil berhasil disimpan!')
    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error('Gagal update profil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">Profil Saya</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-1">No HP</label>
          <input 
            {...register('phone')}
            className={`w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary transition ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="081234567890"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Alamat</label>
          <textarea 
            {...register('address')}
            rows={3}
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary transition border-gray-300"
            placeholder="Alamat lengkap"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Kode Pos</label>
          <input 
            {...register('postal_code')}
            className={`w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary transition ${
              errors.postal_code ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="12345"
          />
          {errors.postal_code && (
            <p className="text-red-500 text-sm mt-1">{errors.postal_code.message}</p>
          )}
        </div>
        <button 
          type="submit" 
          disabled={saving}
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>
    </div>
  )
}
