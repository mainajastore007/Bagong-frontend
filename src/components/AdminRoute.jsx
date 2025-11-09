import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import API from '../api/api'

export default function AdminRoute({ children }) {
  const [isAdmin, setIsAdmin] = useState(null)

  useEffect(() => {
    API.get('/auth/profile/')
      .then(res => setIsAdmin(res.data.is_superuser))
      .catch(() => setIsAdmin(false))
  }, [])

  if (isAdmin === null) return <div className="text-center p-10">Loading...</div>
  return isAdmin ? children : <Navigate to="/" replace />
}
