import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import API, { setAuthToken } from '../api/api'
import { useNavigate, Link } from 'react-router-dom'

const loginSchema = yup.object().shape({
  username: yup.string().required('Username wajib diisi'),
  password: yup.string().required('Password wajib diisi').min(6, 'Password minimal 6 karakter'),
})

export default function Login() {
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(loginSchema)
  })

  const onSubmit = async (data) => {
    setLoading(true)
    const loadingToast = toast.loading('Masuk...')
    
    try {
      const res = await API.post('/auth/login/', data)
      localStorage.setItem('access', res.data.access)
      localStorage.setItem('refresh', res.data.refresh)
      setAuthToken(res.data.access)
      toast.dismiss(loadingToast)
      toast.success('Login berhasil!')
      nav('/')
    } catch (err) {
      toast.dismiss(loadingToast)
      const errorMsg = err.response?.data?.detail || 'Username atau password salah!'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-gradient-to-b from-pink-50 to-white px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded-lg p-6 md:p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-primary mb-6">Login Akun</h2>
        
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
          {loading ? 'Memproses...' : 'Login'}
        </button>
        
        <p className="text-center text-gray-600 mt-4">
          Belum punya akun? <Link to="/register" className="text-primary font-semibold hover:underline">Daftar</Link>
        </p>
      </form>
    </div>
  )
}
