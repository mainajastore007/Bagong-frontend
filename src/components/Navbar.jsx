import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import API from '../api/api'

export default function Navbar() {
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const logged = !!localStorage.getItem('access')

  useEffect(() => {
    if (logged) {
      API.get('/auth/profile/')
        .then(res => setIsAdmin(res.data.is_superuser))
        .catch(() => setIsAdmin(false))
    }
  }, [logged])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showDropdown])

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-6 py-3">
        <Link to="/" className="text-xl md:text-2xl font-bold text-primary">
          Bagong<span className="text-gray-800">Store</span>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6 text-gray-700 font-medium">
          <Link to="/products" className="hover:text-primary transition">Produk</Link>
          {logged ? (
            <>
              <div className="relative dropdown-container">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="hover:text-primary flex items-center gap-1 transition"
                >
                  Profil
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-100">
                    <Link 
                      to="/profile" 
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-primary transition"
                    >
                      Profil Saya
                    </Link>
                    <Link 
                      to="/cart" 
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-primary transition"
                    >
                      Keranjang
                    </Link>
                    <Link 
                      to="/history" 
                      onClick={() => setShowDropdown(false)}
                      className="block px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-primary transition"
                    >
                      Riwayat Pembelian
                    </Link>
                    {isAdmin && (
                      <>
                        <hr className="my-2 border-gray-200" />
                        <Link 
                          to="/admin" 
                          onClick={() => setShowDropdown(false)}
                          className="block px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-primary font-semibold transition"
                        >
                          📊 Dashboard Admin
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
              <button onClick={logout} className="text-primary hover:underline transition">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-primary transition">Login</Link>
              <Link to="/register" className="hover:text-primary transition">Daftar</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden text-gray-700 hover:text-primary transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {showMobileMenu ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-3">
            <Link 
              to="/products" 
              onClick={() => setShowMobileMenu(false)}
              className="block text-gray-700 hover:text-primary transition"
            >
              Produk
            </Link>
            {logged ? (
              <>
                <Link 
                  to="/profile" 
                  onClick={() => setShowMobileMenu(false)}
                  className="block text-gray-700 hover:text-primary transition"
                >
                  Profil Saya
                </Link>
                <Link 
                  to="/cart" 
                  onClick={() => setShowMobileMenu(false)}
                  className="block text-gray-700 hover:text-primary transition"
                >
                  Keranjang
                </Link>
                <Link 
                  to="/history" 
                  onClick={() => setShowMobileMenu(false)}
                  className="block text-gray-700 hover:text-primary transition"
                >
                  Riwayat Pembelian
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    onClick={() => setShowMobileMenu(false)}
                    className="block text-gray-700 hover:text-primary font-semibold transition"
                  >
                    📊 Dashboard Admin
                  </Link>
                )}
                <button 
                  onClick={() => {
                    logout()
                    setShowMobileMenu(false)
                  }} 
                  className="block w-full text-left text-primary hover:underline transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  onClick={() => setShowMobileMenu(false)}
                  className="block text-gray-700 hover:text-primary transition"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setShowMobileMenu(false)}
                  className="block text-gray-700 hover:text-primary transition"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
