import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import API from '../api/api'
import { useNavigate, Link } from 'react-router-dom'

export default function Cart() {
  const [items, setItems] = useState([])
  const nav = useNavigate()

  const fetchCart = () => {
    API.get('/cart/')
      .then(res => setItems(res.data))
      .catch(err => console.error('Error fetching cart:', err))
  }

  useEffect(() => {
    fetchCart()
  }, [])

  const remove = async id => {
    const loadingToast = toast.loading('Menghapus item...')
    try {
      await API.delete(`/cart/${id}/`)
      toast.dismiss(loadingToast)
      toast.success('Item berhasil dihapus')
      fetchCart()
    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error('Gagal menghapus item')
    }
  }

  const subtotal = items.reduce((s, i) => s + (i.product.price * i.quantity), 0)

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

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">Keranjang</h2>
      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Keranjang kosong</p>
          <Link to="/products" className="text-primary underline font-semibold">Belanja dulu</Link>
        </div>
      ) : (
        <>
          <div className="divide-y bg-white rounded-lg shadow-md overflow-hidden">
            {items.map(it => (
              <div key={it.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 px-4 sm:px-6 gap-4">
                <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                  <img 
                    src={getProductImage(it.product)} 
                    alt={it.product.name} 
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-md object-cover flex-shrink-0"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">{it.product.name}</p>
                    {it.variant && (
                      <div className="flex items-center gap-2 mt-1">
                        {it.variant.color_code && (
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                            style={{ backgroundColor: it.variant.color_code }}
                          />
                        )}
                        <span className="text-xs sm:text-sm text-gray-600">Warna: {it.variant.color_name}</span>
                      </div>
                    )}
                    <p className="text-gray-500 text-xs sm:text-sm mt-1">Qty: x{it.quantity}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                  <p className="font-bold text-primary text-sm sm:text-base">Rp {Number(it.product.price * it.quantity).toLocaleString('id-ID')}</p>
                  <button 
                    onClick={() => remove(it.id)} 
                    className="text-sm text-gray-500 hover:text-red-500 transition px-2 py-1"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-4">
            <h3 className="text-xl font-semibold">Total: <span className="text-primary">Rp {Number(subtotal).toLocaleString('id-ID')}</span></h3>
            <button 
              onClick={() => nav('/checkout')} 
              className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  )
}
