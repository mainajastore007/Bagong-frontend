import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import API from '../api/api'
import Pagination from '../components/Pagination'

export default function ProductList() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const itemsPerPage = 12

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await API.get('/categories/')
        setCategories(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      try {
        // Build query parameters
        const params = new URLSearchParams()
        if (selectedCategory) {
          params.append('category', selectedCategory)
        }
        if (minPrice) {
          params.append('min_price', minPrice)
        }
        if (maxPrice) {
          params.append('max_price', maxPrice)
        }
        
        const queryString = params.toString()
        const url = queryString ? `/products/?${queryString}` : '/products/'
        
        const res = await API.get(url)
        const allProducts = res.data
        const total = allProducts.length
        setTotalProducts(total)
        const pages = Math.max(1, Math.ceil(total / itemsPerPage))
        setTotalPages(pages)
        
        // Pagination
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginatedProducts = allProducts.slice(startIndex, endIndex)
        setProducts(paginatedProducts)
      } catch (err) {
        console.error(err)
        toast.error('Gagal memuat produk')
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [currentPage, selectedCategory, minPrice, maxPrice])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const handlePriceChange = () => {
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const clearFilters = () => {
    setSelectedCategory('')
    setMinPrice('')
    setMaxPrice('')
    setCurrentPage(1)
  }

  const getProductImage = (product) => {
    // Priority: 1. First image from images array, 2. Main image, 3. Placeholder
    if (product.images && product.images.length > 0 && product.images[0].image) {
      const imageUrl = product.images[0].image;
      return imageUrl.startsWith('http') ? imageUrl : `http://127.0.0.1:8000${imageUrl}`;
    }
    if (product.image) {
      return product.image.startsWith('http') ? product.image : `http://127.0.0.1:8000${product.image}`;
    }
    return 'https://via.placeholder.com/400x400?text=No+Image';
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden animate-pulse">
              <div className="w-full h-56 bg-gray-200"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h2 className="text-2xl font-bold text-primary mb-6">Produk Kami</h2>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Min Price Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Harga Minimum</label>
            <input
              type="number"
              placeholder="Min (Rp)"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onBlur={handlePriceChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handlePriceChange()
                }
              }}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Max Price Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Harga Maksimum</label>
            <input
              type="number"
              placeholder="Max (Rp)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onBlur={handlePriceChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handlePriceChange()
                }
              }}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
            >
              Reset Filter
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedCategory || minPrice || maxPrice) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedCategory && (
              <span className="px-3 py-1 bg-primary text-white rounded-full text-xs font-medium flex items-center gap-2">
                Kategori: {categories.find(c => c.id === parseInt(selectedCategory))?.name}
                <button
                  onClick={() => handleCategoryChange('')}
                  className="ml-1 hover:underline"
                >
                  ×
                </button>
              </span>
            )}
            {minPrice && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-2">
                Min: Rp {Number(minPrice).toLocaleString('id-ID')}
                <button
                  onClick={() => {
                    setMinPrice('')
                    handlePriceChange()
                  }}
                  className="ml-1 hover:underline"
                >
                  ×
                </button>
              </span>
            )}
            {maxPrice && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-2">
                Max: Rp {Number(maxPrice).toLocaleString('id-ID')}
                <button
                  onClick={() => {
                    setMaxPrice('')
                    handlePriceChange()
                  }}
                  className="ml-1 hover:underline"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>
      
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Tidak ada produk ditemukan</p>
          {(selectedCategory || minPrice || maxPrice) && (
            <button
              onClick={clearFilters}
              className="mt-4 text-primary hover:underline font-semibold"
            >
              Hapus Filter
            </button>
          )}
        </div>
      ) : (
        <>
          {totalProducts > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              Menampilkan {products.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalProducts)} dari {totalProducts} produk
              {(selectedCategory || minPrice || maxPrice) && ' (setelah filter)'}
            </div>
          )}
          
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map(p => (
              <Link key={p.id} to={`/products/${p.id}`} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition">
                <div className="w-full h-56 bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img 
                    src={getProductImage(p)} 
                    alt={p.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    }}
                  />
                </div>
                <div className="p-4">
                  {p.category && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block mb-2">
                      {p.category.name}
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-800">{p.name}</h3>
                  <p className="text-primary font-bold mt-2">Rp {Number(p.price).toLocaleString('id-ID')}</p>
                </div>
              </Link>
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
