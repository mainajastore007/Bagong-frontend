import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import API from '../api/api'
import Pagination from '../components/Pagination'

export default function History() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchOrders()
  }, [currentPage])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await API.get('/orders/')
      const allOrders = res.data
      const total = allOrders.length
      const pages = Math.ceil(total / itemsPerPage)
      setTotalPages(pages)
      
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      setOrders(allOrders.slice(startIndex, endIndex))
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat riwayat pesanan')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border rounded-lg shadow-sm p-4 bg-white">
                <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">Riwayat Pembelian</h2>
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Belum ada pesanan yang dibuat.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="border rounded-lg shadow-sm p-4 md:p-6 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 text-lg">Order #{order.id}</h3>
                  <p className="text-sm text-gray-600 mt-1 sm:mt-0">
                    Status: <span className="font-semibold text-primary">{order.status}</span>
                  </p>
                </div>
                <ul className="list-disc ml-4 md:ml-6 text-sm text-gray-700 space-y-1 mb-3">
                  {order.items.map(it => (
                    <li key={it.id} className="break-words">
                      {it.product?.name || 'Produk telah dihapus'} 
                      {it.variant_name && ` - ${it.variant_name}`}
                      {it.variant && ` - ${it.variant.color_name}`}
                      {' '}x{it.quantity} — Rp {Number(it.price * it.quantity).toLocaleString('id-ID')}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-2 sm:mb-0">
                    {new Date(order.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <div className="font-semibold text-gray-800">
                    Total: <span className="text-primary text-lg">Rp {Number(order.total).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}
