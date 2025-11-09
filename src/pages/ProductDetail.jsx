import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import API from '../api/api'

export default function ProductDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [product, setProduct] = useState(null)
  const [qty, setQty] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    API.get(`/products/${id}/`)
      .then(res => {
        setProduct(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        toast.error('Gagal memuat produk')
        setLoading(false)
      })
  }, [id])

  const addToCart = async (showMessage = true) => {
    // Check if product has variants and variant is selected
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      toast.error('Pilih warna terlebih dahulu!')
      return false
    }

    // Check stock
    const availableStock = selectedVariant ? selectedVariant.stock : product.stock
    if (availableStock < qty) {
      toast.error(`Stok tidak cukup! Stok tersedia: ${availableStock}`)
      return false
    }

    setIsAddingToCart(true)
    const loadingToast = toast.loading('Menambahkan ke keranjang...')
    
    try {
      const cartData = {
        product_id: product.id,
        quantity: qty
      }
      
      if (selectedVariant) {
        cartData.variant_id = selectedVariant.id
      }
      
      await API.post('/cart/', cartData)
      
      toast.dismiss(loadingToast)
      
      if (showMessage) {
        toast.success('Berhasil ditambahkan ke keranjang!')
      }
      
      return true
    } catch (err) {
      toast.dismiss(loadingToast)
      const errorMsg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Login dulu bro 😅'
      toast.error(errorMsg)
      if (errorMsg.includes('Login') || errorMsg.includes('login')) {
        setTimeout(() => nav('/login'), 1000)
      }
      return false
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleCheckout = async () => {
    // Add to cart first
    const success = await addToCart(false)
    
    if (success) {
      // Redirect to checkout
      nav('/checkout')
    }
  }

  if (loading || !product) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-gray-200 rounded-xl h-96"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Get all images (main image + additional images)
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return imagePath.startsWith('http') ? imagePath : `http://127.0.0.1:8000${imagePath}`;
  }

  const allImages = [];
  
  // Add images from images array first
  if (product.images && product.images.length > 0) {
    product.images.forEach(img => {
      if (img.image) {
        allImages.push(getImageUrl(img.image));
      }
    });
  }
  
  // Add main image if not already in images array
  if (product.image && !allImages.includes(getImageUrl(product.image))) {
    const mainImageUrl = getImageUrl(product.image);
    if (mainImageUrl) {
      allImages.unshift(mainImageUrl); // Add at beginning
    }
  }
  
  // Fallback to placeholder if no images
  if (allImages.length === 0) {
    allImages.push('https://via.placeholder.com/600x600?text=No+Image');
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 grid md:grid-cols-2 gap-6 md:gap-10">
      {/* Image Carousel */}
      <div className="relative">
        <div className="relative rounded-xl shadow-md overflow-hidden bg-gray-100">
          <img 
            src={allImages[currentImageIndex]} 
            alt={product.name} 
            className="w-full h-96 object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/600x600?text=No+Image';
            }}
          />
          
          {/* Navigation Arrows */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70"
              >
                ←
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70"
              >
                →
              </button>
            </>
          )}

          {/* Image Counter */}
          {allImages.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {allImages.length}
            </div>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {allImages.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 bg-gray-100 ${
                  currentImageIndex === idx ? 'border-primary' : 'border-transparent'
                }`}
              >
                <img 
                  src={img} 
                  alt="" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div>
        <h1 className="text-3xl font-bold mb-3">{product.name}</h1>
        <p className="text-primary text-2xl font-semibold mb-4">Rp {Number(product.price).toLocaleString('id-ID')}</p>
        <p className="text-gray-600 mb-6">{product.description}</p>

        {/* Variant Selection */}
        {product.variants && product.variants.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Pilih Warna:</label>
            <div className="flex flex-wrap gap-2">
              {product.variants.filter(v => v.is_active).map(variant => (
                <button
                  key={variant.id}
                  onClick={() => {
                    setSelectedVariant(variant)
                    setQty(1) // Reset quantity when variant changes
                  }}
                  className={`px-4 py-2 rounded-lg border-2 transition ${
                    selectedVariant?.id === variant.id
                      ? 'border-primary bg-pink-50'
                      : 'border-gray-200 hover:border-primary'
                  } ${variant.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={variant.stock === 0}
                >
                  <div className="flex items-center gap-2">
                    {variant.color_code && (
                      <div 
                        className="w-5 h-5 rounded-full border border-gray-300"
                        style={{ backgroundColor: variant.color_code }}
                      />
                    )}
                    <span className="font-medium">{variant.color_name}</span>
                    <span className="text-xs text-gray-500">({variant.stock})</span>
                  </div>
                </button>
              ))}
            </div>
            {selectedVariant && selectedVariant.stock === 0 && (
              <p className="text-sm text-red-500 mt-2">Warna ini stok habis</p>
            )}
          </div>
        )}

        {/* Stock Display */}
        <p className="text-sm text-gray-500 mb-6">
          Stok: {selectedVariant ? selectedVariant.stock : product.stock}
        </p>

        <div className="flex items-center gap-4 mb-6">
          <span>Qty:</span>
          <input 
            type="number" 
            min={1} 
            max={selectedVariant ? selectedVariant.stock : product.stock}
            value={qty} 
            onChange={e => setQty(Number(e.target.value))} 
            className="w-20 border rounded-lg p-1 text-center" 
          />
        </div>


        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => addToCart(true)} 
            disabled={
              (selectedVariant ? selectedVariant.stock === 0 : product.stock === 0) ||
              (product.variants && product.variants.length > 0 && !selectedVariant) ||
              isAddingToCart
            }
            className="flex-1 px-4 md:px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm md:text-base"
          >
            {isAddingToCart 
              ? 'Menambahkan...' 
              : (selectedVariant ? selectedVariant.stock === 0 : product.stock === 0)
              ? 'Stok Habis' 
              : (product.variants && product.variants.length > 0 && !selectedVariant)
              ? 'Pilih Warna'
              : 'Tambah ke Keranjang'}
          </button>
          
          <button 
            onClick={handleCheckout} 
            disabled={
              (selectedVariant ? selectedVariant.stock === 0 : product.stock === 0) ||
              (product.variants && product.variants.length > 0 && !selectedVariant) ||
              isAddingToCart
            }
            className="flex-1 px-4 md:px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm md:text-base"
          >
            {isAddingToCart ? 'Memproses...' : 'Checkout'}
          </button>
        </div>
      </div>
    </div>
  )
}
