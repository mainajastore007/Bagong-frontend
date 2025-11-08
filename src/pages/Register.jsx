import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import API from '../api/api'
import { Link, useNavigate } from 'react-router-dom'

const registerSchema = yup.object().shape({
  username: yup.string().required('Username wajib diisi').min(3, 'Username minimal 3 karakter'),
  email: yup.string().required('Email wajib diisi').email('Email tidak valid'),
  password: yup.string().required('Password wajib diisi').min(6, 'Password minimal 6 karakter'),
})

export default function Register() {
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(registerSchema)
  })

  const onSubmit = async (data) => {
    setLoading(true)
    const loadingToast = toast.loading('Mendaftar...')
    
    try {
      await API.post('/auth/register/', data)
      toast.dismiss(loadingToast)
      toast.success('Akun berhasil dibuat! Silakan login.')
      setTimeout(() => nav('/login'), 1500)
    } catch (err) {
      toast.dismiss(loadingToast)
      const errorMsg = err.response?.data?.username?.[0] || 
                       err.response?.data?.email?.[0] || 
                       err.response?.data?.password?.[0] ||
                       'Gagal daftar. Coba lagi.'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-gradient-to-b from-white to-pink-50 px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded-lg p-6 md:p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-primary mb-6">Daftar Akun</h2>
        
        <div className="mb-4">
          <input 
            type="text" 
            {...register('username')}
            placeholder="Username"
            className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary transition ${
              errors.username ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
          )}
        </div>
        
        <div className="mb-4">
          <input 
            type="email" 
            {...register('email')}
            placeholder="Email"
            className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary transition ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        
        <div className="mb-6">
          <input 
            type="password" 
            {...register('password')}
            placeholder="Password"
            className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary transition ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Memproses...' : 'Daftar'}
        </button>
        
        <p className="text-center text-gray-600 mt-4">
          Sudah punya akun? <Link to="/login" className="text-primary font-semibold hover:underline">Login</Link>
        </p>
      </form>
    </div>
  )
}
