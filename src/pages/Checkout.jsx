import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import API from '../api/api'
import { useNavigate } from 'react-router-dom'

const checkoutSchema = yup.object().shape({
  full_name: yup.string().required('Nama lengkap wajib diisi'),
  address: yup.string().required('Alamat wajib diisi'),
  phone: yup.string().required('No HP wajib diisi').matches(/^[0-9+\-\s()]*$/, 'Format nomor HP tidak valid'),
  postal_code: yup.string().required('Kode pos wajib diisi').matches(/^[0-9]*$/, 'Kode pos harus berupa angka'),
  coupon_code: yup.string(),
})

export default function Checkout() {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [updatingQuantity, setUpdatingQuantity] = useState(null)
  const nav = useNavigate()
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: yupResolver(checkoutSchema),
    defaultValues: {
      full_name: '',
      address: '',
      phone: '',
      postal_code: '',
      coupon_code: ''
    }
  })
  
  const couponCode = watch('coupon_code')

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const res = await API.get('/cart/')
      setCartItems(res.data)
      if (res.data.length === 0) {
        toast.error('Keranjang kosong!')
        setTimeout(() => nav('/products'), 1000)
      }
    } catch (err) {
      console.error('Error fetching cart:', err)
      toast.error('Gagal memuat keranjang')
      nav('/login')
    } finally {
      setLoading(false)
    }
  }

  const applyCoupon = async () => {
    if (!couponCode || !couponCode.trim()) {
      setCouponError('Masukkan kode kupon')
      return
    }

    setApplyingCoupon(true)
    setCouponError('')

    try {
      const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      
      // Validate coupon using API endpoint
      const response = await API.post('/coupons/validate/', {
        code: couponCode.trim(),
        subtotal: subtotal
      })

      if (response.data.valid) {
        setAppliedCoupon(response.data.coupon)
        setDiscountAmount(response.data.discount_amount)
        setCouponError('')
      } else {
        setCouponError(response.data.message || 'Kode kupon tidak valid')
        setAppliedCoupon(null)
        setDiscountAmount(0)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Gagal memvalidasi kupon'
      setCouponError(errorMsg)
      setAppliedCoupon(null)
      setDiscountAmount(0)
    } finally {
      setApplyingCoupon(false)
    }
  }

  // Re-calculate discount when cart items change
  useEffect(() => {
    if (appliedCoupon) {
      const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      const discount = Math.floor((subtotal * appliedCoupon.discount_percent) / 100)
      setDiscountAmount(discount)
    }
  }, [cartItems, appliedCoupon])

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      return
    }

    setUpdatingQuantity(itemId)
    try {
      // Get the cart item
      const item = cartItems.find(i => i.id === itemId)
      if (!item) {
        setUpdatingQuantity(null)
        return
      }

      // Check stock
      const availableStock = item.variant ? item.variant.stock : item.product.stock
      if (newQuantity > availableStock) {
        toast.error(`Stok tidak cukup! Stok tersedia: ${availableStock}`)
        setUpdatingQuantity(null)
        return
      }

      // Delete old item
      await API.delete(`/cart/${itemId}/`)
      
      // Add new item with new quantity
      const cartData = {
        product_id: item.product.id,
        quantity: newQuantity
      }
      
      if (item.variant) {
        cartData.variant_id = item.variant.id
      }
      
      await API.post('/cart/', cartData)
      
      // Refresh cart and get updated items
      const res = await API.get('/cart/')
      const updatedItems = res.data
      setCartItems(updatedItems)
      
      // Re-calculate discount if coupon is applied
      if (appliedCoupon) {
        const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
        const newDiscount = Math.floor((newSubtotal * appliedCoupon.discount_percent) / 100)
        setDiscountAmount(newDiscount)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Gagal mengupdate quantity'
      toast.error(errorMsg)
      await fetchCart() // Refresh to get correct state
    } finally {
      setUpdatingQuantity(null)
    }
  }

  const removeItem = async (itemId) => {
    if (!window.confirm('Hapus item dari keranjang?')) {
      return
    }

    const loadingToast = toast.loading('Menghapus item...')
    
    try {
      await API.delete(`/cart/${itemId}/`)
      const res = await API.get('/cart/')
      const updatedItems = res.data
      
      toast.dismiss(loadingToast)
      toast.success('Item berhasil dihapus')
      setCartItems(updatedItems)
      
      // Check if cart is empty
      if (updatedItems.length === 0) {
        toast.error('Keranjang kosong!')
        setTimeout(() => nav('/products'), 1000)
        return
      }
      
      // Re-calculate discount if coupon is applied
      if (appliedCoupon) {
        const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
        const newDiscount = Math.floor((newSubtotal * appliedCoupon.discount_percent) / 100)
        setDiscountAmount(newDiscount)
      }
    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error('Gagal menghapus item')
      await fetchCart()
    }
  }

  const decreaseQuantity = (item) => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1)
    }
  }

  const increaseQuantity = (item) => {
    const availableStock = item.variant ? item.variant.stock : item.product.stock
    if (item.quantity < availableStock) {
      updateQuantity(item.id, item.quantity + 1)
    } else {
      toast.error(`Stok tidak cukup! Stok tersedia: ${availableStock}`)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setDiscountAmount(0)
    setValue('coupon_code', '')
    setCouponError('')
  }

  const onSubmit = async (data) => {
    const loadingToast = toast.loading('Memproses checkout...')
    
    try {
      // Use applied coupon code if available, otherwise use form coupon_code
      const checkoutData = {
        ...data,
        coupon_code: appliedCoupon ? appliedCoupon.code : data.coupon_code
      }
      
      const res = await API.post('/orders/create/', checkoutData)
      toast.dismiss(loadingToast)
      
      // Check if we have snap_token for Midtrans payment
      if (res.data.snap_token) {
        // Store client key in localStorage
        if (res.data.midtrans_client_key) {
          localStorage.setItem('midtrans_client_key', res.data.midtrans_client_key)
        }
        // Redirect to payment page with snap token
        nav(`/payment?token=${res.data.snap_token}&order_id=${res.data.order.id}`)
      } else {
        // If no snap token, show error
        toast.error(res.data.error || 'Gagal membuat token pembayaran')
      }
    } catch (err) {
      toast.dismiss(loadingToast)
      const errorMsg = err.response?.data?.detail || 'Checkout gagal, periksa input atau login dulu!'
      toast.error(errorMsg)
    }
  }

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0 && product.images[0].image) {
      const imageUrl = product.images[0].image;
      return imageUrl.startsWith('http') ? imageUrl : `http://127.0.0.1:8000${imageUrl}`;
    }
    if (product.image) {
      return product.image.startsWith('http') ? product.image : `http://127.0.0.1:8000${product.image}`;
    }
    return 'https://via.placeholder.com/80';
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const total = subtotal - discountAmount

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 pb-4 border-b">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">Checkout</h2>
      
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* Cart Items Summary */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h3>
            <div className="space-y-4">
              {cartItems.map(item => {
                const availableStock = item.variant ? item.variant.stock : item.product.stock
                const isUpdating = updatingQuantity === item.id
                
                return (
                  <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-0">
                    <img 
                      src={getProductImage(item.product)} 
                      alt={item.product.name}
                      className="w-20 h-20 rounded-lg object-cover bg-gray-100"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80';
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{item.product.name}</p>
                          {item.variant && (
                            <div className="flex items-center gap-2 mt-1">
                              {item.variant.color_code && (
                                <div 
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: item.variant.color_code }}
                                />
                              )}
                              <span className="text-sm text-gray-600">Warna: {item.variant.color_name}</span>
                            </div>
                          )}
                          <p className="text-sm text-gray-500 mt-1">Rp {Number(item.product.price).toLocaleString('id-ID')} per item</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm ml-2"
                          title="Hapus item"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-sm text-gray-600">Jumlah:</span>
                        <div className={`flex items-center border rounded-lg ${isUpdating ? 'border-blue-300 bg-blue-50' : 'border-gray-300'}`}>
                          <button
                            onClick={() => decreaseQuantity(item)}
                            disabled={isUpdating || item.quantity <= 1}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition"
                            title="Kurangi"
                          >
                            {isUpdating ? (
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            )}
                          </button>
                          <span className="px-4 py-1.5 text-sm font-medium min-w-[3rem] text-center bg-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => increaseQuantity(item)}
                            disabled={isUpdating || item.quantity >= availableStock}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition"
                            title="Tambah"
                          >
                            {isUpdating ? (
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {item.quantity >= availableStock && (
                          <span className="text-xs text-red-500">Stok maksimal</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">Rp {Number(item.product.price * item.quantity).toLocaleString('id-ID')}</p>
                      <p className="text-xs text-gray-500 mt-1">Stok: {availableStock}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="font-medium">Rp {Number(subtotal).toLocaleString('id-ID')}</span>
              </div>
              
              {appliedCoupon && discountAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Diskon ({appliedCoupon.discount_percent}%):
                  </span>
                  <span className="font-medium text-green-600">
                    - Rp {Number(discountAmount).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold text-primary">Rp {Number(total).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-4 lg:sticky lg:top-4">
            <h3 className="text-xl font-semibold mb-4">Data Pembeli</h3>
            <div>
              <label className="block text-gray-700 font-medium text-sm mb-1">Nama Lengkap</label>
              <input 
                {...register('full_name')}
                className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition ${
                  errors.full_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nama lengkap"
              />
              {errors.full_name && (
                <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-medium text-sm mb-1">Alamat</label>
              <textarea 
                {...register('address')}
                rows={3}
                className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Alamat lengkap"
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-medium text-sm mb-1">No HP</label>
                <input 
                  {...register('phone')}
                  className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="081234567890"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 font-medium text-sm mb-1">Kode Pos</label>
                <input 
                  {...register('postal_code')}
                  className={`w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition ${
                    errors.postal_code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="12345"
                />
                {errors.postal_code && (
                  <p className="text-red-500 text-xs mt-1">{errors.postal_code.message}</p>
                )}
              </div>
            </div>
            {/* Coupon Section */}
            <div>
              <label className="block text-gray-700 font-medium text-sm mb-2">Kode Kupon (opsional)</label>
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input 
                    {...register('coupon_code')}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        applyCoupon()
                      }
                    }}
                    onChange={(e) => {
                      setValue('coupon_code', e.target.value)
                      setCouponError('')
                    }}
                    className="flex-1 border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition border-gray-300" 
                    placeholder="Masukkan kode kupon" 
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={applyingCoupon || !couponCode || !couponCode.trim()}
                    className="px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
                  >
                    {applyingCoupon ? '...' : 'Terapkan'}
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-800">✓ Kupon diterapkan!</p>
                      <p className="text-xs text-green-600 mt-1">
                        {appliedCoupon.code} - Diskon {appliedCoupon.discount_percent}%
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-red-500 hover:text-red-700 text-sm font-medium transition"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )}
              {couponError && (
                <p className="text-red-500 text-xs mt-1">{couponError}</p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="pt-2 border-t space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">Rp {Number(subtotal).toLocaleString('id-ID')}</span>
              </div>
              
              {appliedCoupon && discountAmount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Diskon ({appliedCoupon.discount_percent}%):</span>
                  <span className="font-medium text-green-600">- Rp {Number(discountAmount).toLocaleString('id-ID')}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold text-lg">Total:</span>
                <span className="text-xl font-bold text-primary">Rp {Number(total).toLocaleString('id-ID')}</span>
              </div>
              
              <button type="submit" className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:opacity-90 transition mt-4">
                Bayar Sekarang
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
