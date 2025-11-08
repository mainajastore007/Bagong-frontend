import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import API from '../api/api'

export default function AdminDashboard() {
  const [tab, setTab] = useState('products')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [coupons, setCoupons] = useState([])
  const [categories, setCategories] = useState([])
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', description: '', category_id: '' })
  const [editingProduct, setEditingProduct] = useState(null)
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_percent: '', max_usage: 1 })
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  const [editingCategory, setEditingCategory] = useState(null)
  const [selectedImages, setSelectedImages] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [editingVariant, setEditingVariant] = useState(null)
  const [newVariant, setNewVariant] = useState({ color_name: '', color_code: '', stock: 0 })

  const fetchProducts = async () => {
    const res = await API.get('/admin/products/')
    setProducts(res.data)
  }

  const fetchOrders = async () => {
    const res = await API.get('/orders/')
    setOrders(res.data)
  }

  const fetchCoupons = async () => {
    const res = await API.get('/coupons/')
    setCoupons(res.data)
  }

  const fetchCategories = async () => {
    const res = await API.get('/categories/')
    setCategories(res.data)
  }

  useEffect(() => {
    const loadData = async () => {
      if (tab === 'products') {
        await fetchProducts()
        await fetchCategories() // Load categories for product form
      } else if (tab === 'orders') {
        await fetchOrders()
      } else if (tab === 'coupons') {
        await fetchCoupons()
      } else if (tab === 'categories') {
        await fetchCategories()
      }
    }
    loadData()
  }, [tab])

  const addProduct = async (e) => {
    e.preventDefault()
    const loadingToast = toast.loading('Menambahkan produk...')
    
    try {
      // Prepare product data
      const productData = {
        name: newProduct.name,
        price: newProduct.price,
        stock: newProduct.stock,
        description: newProduct.description,
        category_id: newProduct.category_id || null
      }
      
      // Create product first
      const res = await API.post('/admin/products/', productData)
      const productId = res.data.id
      
      // Upload images if any
      if (selectedImages.length > 0) {
        await uploadImages(productId, false) // Don't show alert for upload
      }
      
      setNewProduct({ name: '', price: '', stock: '', description: '', category_id: '' })
      setSelectedImages([])
      fetchProducts()
      
      toast.dismiss(loadingToast)
      const message = selectedImages.length > 0 
        ? `Produk berhasil ditambahkan dengan ${selectedImages.length} foto!`
        : 'Produk berhasil ditambahkan!'
      toast.success(message)
    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error('Gagal menambahkan produk')
      console.error(err)
    }
  }

  const updateProduct = async (e) => {
    e.preventDefault()
    const loadingToast = toast.loading('Mengupdate produk...')
    
    try {
      // Prepare data with category_id
      const updateData = {
        name: editingProduct.name,
        price: editingProduct.price,
        stock: editingProduct.stock,
        description: editingProduct.description,
        category_id: editingProduct.category_id || editingProduct.category?.id || null
      }
      await API.put(`/admin/products/${editingProduct.id}/`, updateData)
      setEditingProduct(null)
      fetchProducts()
      toast.dismiss(loadingToast)
      toast.success('Produk berhasil diupdate!')
    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error('Gagal mengupdate produk')
    }
  }

  const deleteProduct = async (id) => {
    if (window.confirm('Yakin ingin menghapus produk ini?')) {
      const loadingToast = toast.loading('Menghapus produk...')
      try {
        await API.delete(`/admin/products/${id}/`)
        fetchProducts()
        toast.dismiss(loadingToast)
        toast.success('Produk berhasil dihapus!')
      } catch (err) {
        toast.dismiss(loadingToast)
        toast.error('Gagal menghapus produk')
      }
    }
  }

  const addCoupon = async (e) => {
    e.preventDefault()
    const loadingToast = toast.loading('Menambahkan kupon...')
    
    try {
      await API.post('/coupons/', newCoupon)
      setNewCoupon({ code: '', discount_percent: '', max_usage: 1 })
      fetchCoupons()
      toast.dismiss(loadingToast)
      toast.success('Kupon berhasil ditambahkan!')
    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error('Gagal menambahkan kupon')
    }
  }

  const toggleCouponStatus = async (id, currentStatus) => {
    try {
      await API.patch(`/coupons/${id}/`, { active: !currentStatus })
      fetchCoupons()
      toast.success(`Kupon ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}!`)
    } catch (err) {
      toast.error('Gagal mengupdate status kupon')
    }
  }

  const uploadImages = async (productId, showAlert = true) => {
    if (selectedImages.length === 0) return
    
    setUploadingImages(true)
    const formData = new FormData()
    selectedImages.forEach(image => {
      formData.append('images', image)
    })
    
    try {
      await API.post(`/admin/products/${productId}/upload-images/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSelectedImages([])
      fetchProducts()
      if (showAlert) {
        toast.success('Foto berhasil diupload!')
      }
    } catch (err) {
      toast.error('Gagal upload foto')
      throw err
    } finally {
      setUploadingImages(false)
    }
  }

  const deleteProductImage = async (productId, imageId) => {
    if (window.confirm('Hapus foto ini?')) {
      const loadingToast = toast.loading('Menghapus foto...')
      try {
        await API.delete(`/admin/products/${productId}/delete-image/${imageId}/`)
        fetchProducts()
        toast.dismiss(loadingToast)
        toast.success('Foto berhasil dihapus!')
      } catch (err) {
        toast.dismiss(loadingToast)
        toast.error('Gagal menghapus foto')
      }
    }
  }

  const addVariant = async (productId) => {
    if (!newVariant.color_name || !newVariant.stock) {
      toast.error('Nama warna dan stok harus diisi!')
      return
    }
    const loadingToast = toast.loading('Menambahkan variant...')
    try {
      await API.post(`/admin/products/${productId}/add-variant/`, newVariant)
      setNewVariant({ color_name: '', color_code: '', stock: 0 })
      fetchProducts()
      toast.dismiss(loadingToast)
      toast.success('Variant berhasil ditambahkan!')
    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error('Gagal menambahkan variant')
    }
  }

  const updateVariant = async (productId, variantId) => {
    const loadingToast = toast.loading('Mengupdate variant...')
    try {
      await API.patch(`/admin/products/${productId}/update-variant/${variantId}/`, editingVariant)
      setEditingVariant(null)
      fetchProducts()
      toast.dismiss(loadingToast)
      toast.success('Variant berhasil diupdate!')
    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error('Gagal update variant')
    }
  }

  const deleteVariant = async (productId, variantId) => {
    if (window.confirm('Hapus variant ini?')) {
      const loadingToast = toast.loading('Menghapus variant...')
      try {
        await API.delete(`/admin/products/${productId}/delete-variant/${variantId}/`)
        fetchProducts()
        toast.dismiss(loadingToast)
        toast.success('Variant berhasil dihapus!')
      } catch (err) {
        toast.dismiss(loadingToast)
        toast.error('Gagal menghapus variant')
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">Admin Dashboard</h2>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 md:gap-4 mb-6">
        {['products', 'orders', 'coupons'].map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`px-3 md:px-4 py-2 rounded-lg font-semibold text-sm md:text-base transition ${
                  tab === item 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
        ))}
      </div>

      {/* Product Management */}
      {tab === 'products' && (
        <div>
          <h3 className="text-xl font-semibold mb-3">Kelola Produk</h3>

              {/* Add Product Form */}
              <form onSubmit={addProduct} className="bg-white shadow-md rounded-lg p-4 md:p-6 mb-6 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input placeholder="Nama Produk" className="border rounded-lg p-2" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
              <input placeholder="Harga" type="number" className="border rounded-lg p-2" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required />
              <input placeholder="Stock" type="number" className="border rounded-lg p-2" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} required />
              <select 
                className="border rounded-lg p-2" 
                value={newProduct.category_id || ''} 
                onChange={e => setNewProduct({...newProduct, category_id: e.target.value || null})}
              >
                <option value="">Pilih Kategori (Opsional)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <input placeholder="Deskripsi" className="border rounded-lg p-2 md:col-span-2" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
            </div>
            
            {/* Upload Images Section */}
            <div className="border-t pt-3">
              <label className="block text-sm font-medium mb-2">Foto Produk (Opsional):</label>
              <input 
                type="file"
                multiple
                accept="image/*"
                onChange={e => setSelectedImages(Array.from(e.target.files))}
                className="w-full border rounded-lg p-2"
              />
              {selectedImages.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-600">📸 {selectedImages.length} foto dipilih</span>
                  <button
                    type="button"
                    onClick={() => setSelectedImages([])}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
            
            <button 
              type="submit"
              disabled={uploadingImages}
              className="w-full bg-primary text-white py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {uploadingImages ? 'Menambahkan...' : selectedImages.length > 0 ? `Tambah Produk + ${selectedImages.length} Foto` : 'Tambah Produk'}
            </button>
          </form>

          {/* Edit Product Modal */}
          {editingProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
                <h4 className="text-xl font-bold mb-4">Edit Produk</h4>
                    <form onSubmit={updateProduct} className="space-y-3">
                      <input
                        placeholder="Nama Produk"
                        className="w-full border rounded-lg p-2"
                        value={editingProduct.name}
                        onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                        required
                      />
                      <input
                        placeholder="Harga"
                        type="number"
                        className="w-full border rounded-lg p-2"
                        value={editingProduct.price}
                        onChange={e => setEditingProduct({...editingProduct, price: e.target.value})}
                        required
                      />
                      <input
                        placeholder="Stock"
                        type="number"
                        className="w-full border rounded-lg p-2"
                        value={editingProduct.stock}
                        onChange={e => setEditingProduct({...editingProduct, stock: e.target.value})}
                        required
                      />
                      <select 
                        className="w-full border rounded-lg p-2" 
                        value={editingProduct.category_id || editingProduct.category?.id || ''} 
                        onChange={e => setEditingProduct({...editingProduct, category_id: e.target.value || null})}
                      >
                        <option value="">Pilih Kategori (Opsional)</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <textarea
                        placeholder="Deskripsi"
                        className="w-full border rounded-lg p-2"
                        value={editingProduct.description}
                        onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                        rows={3}
                      />
                  
                  {/* Current Images */}
                  {editingProduct.images && editingProduct.images.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Foto Produk Saat Ini:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {editingProduct.images.map(img => (
                          <div key={img.id} className="relative group">
                            <img 
                              src={`http://127.0.0.1:8000${img.image}`} 
                              alt="Product" 
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => deleteProductImage(editingProduct.id, img.id)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Upload New Images */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Tambah Foto Baru:</label>
                    <input 
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={e => setSelectedImages(Array.from(e.target.files))}
                      className="w-full border rounded-lg p-2"
                    />
                    {selectedImages.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        {selectedImages.length} foto dipilih
                      </div>
                    )}
                    {selectedImages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => uploadImages(editingProduct.id)}
                        disabled={uploadingImages}
                        className="mt-2 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                      >
                        {uploadingImages ? 'Mengupload...' : `Upload ${selectedImages.length} Foto`}
                      </button>
                    )}
                  </div>

                  {/* Product Variants */}
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium mb-3">Warna & Stok:</label>
                    
                    {/* Current Variants */}
                    {editingProduct.variants && editingProduct.variants.length > 0 && (
                      <div className="mb-4 space-y-2">
                        {editingProduct.variants.map(variant => (
                          <div key={variant.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <div className="flex-1 flex items-center gap-2">
                              {variant.color_code && (
                                <div 
                                  className="w-6 h-6 rounded border border-gray-300"
                                  style={{ backgroundColor: variant.color_code }}
                                />
                              )}
                              <span className="font-medium">{variant.color_name}</span>
                              <span className="text-sm text-gray-500">(Stok: {variant.stock})</span>
                              {!variant.is_active && (
                                <span className="text-xs text-red-500">(Nonaktif)</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingVariant(variant)}
                              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteVariant(editingProduct.id, variant.id)}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Hapus
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Edit Variant Modal */}
                    {editingVariant && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h5 className="font-medium mb-2">Edit Variant:</h5>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Nama Warna"
                            className="w-full border rounded-lg p-2 text-sm"
                            value={editingVariant.color_name}
                            onChange={e => setEditingVariant({...editingVariant, color_name: e.target.value})}
                          />
                          <input
                            type="text"
                            placeholder="Color Code (e.g. #FF0000)"
                            className="w-full border rounded-lg p-2 text-sm"
                            value={editingVariant.color_code || ''}
                            onChange={e => setEditingVariant({...editingVariant, color_code: e.target.value})}
                          />
                          <input
                            type="number"
                            placeholder="Stok"
                            className="w-full border rounded-lg p-2 text-sm"
                            value={editingVariant.stock}
                            onChange={e => setEditingVariant({...editingVariant, stock: parseInt(e.target.value) || 0})}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => updateVariant(editingProduct.id, editingVariant.id)}
                              className="flex-1 bg-green-500 text-white py-1 rounded text-sm hover:bg-green-600"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingVariant(null)}
                              className="flex-1 bg-gray-300 text-gray-700 py-1 rounded text-sm hover:bg-gray-400"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add New Variant */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-medium mb-2 text-sm">Tambah Warna Baru:</h5>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Nama Warna (e.g. Merah, Biru)"
                          className="w-full border rounded-lg p-2 text-sm"
                          value={newVariant.color_name}
                          onChange={e => setNewVariant({...newVariant, color_name: e.target.value})}
                        />
                        <input
                          type="text"
                          placeholder="Color Code (opsional, e.g. #FF0000)"
                          className="w-full border rounded-lg p-2 text-sm"
                          value={newVariant.color_code}
                          onChange={e => setNewVariant({...newVariant, color_code: e.target.value})}
                        />
                        <input
                          type="number"
                          placeholder="Stok"
                          className="w-full border rounded-lg p-2 text-sm"
                          value={newVariant.stock}
                          onChange={e => setNewVariant({...newVariant, stock: parseInt(e.target.value) || 0})}
                        />
                        <button
                          type="button"
                          onClick={() => addVariant(editingProduct.id)}
                          className="w-full bg-primary text-white py-2 rounded-lg text-sm hover:opacity-90"
                        >
                          Tambah Warna
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4 border-t">
                    <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg hover:opacity-90">Simpan Info</button>
                    <button type="button" onClick={() => { setEditingProduct(null); setSelectedImages([]); setEditingVariant(null) }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">Tutup</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-pink-50">
                <tr>
                  <th className="p-3 text-left">Nama</th>
                  <th className="p-3 text-left">Harga</th>
                  <th className="p-3 text-left">Stok</th>
                  <th className="p-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b">
                    <td className="p-3">{p.name}</td>
                    <td className="p-3">Rp {Number(p.price).toLocaleString('id-ID')}</td>
                    <td className="p-3">{p.stock}</td>
                    <td className="p-3 space-x-2">
                      <button onClick={() => setEditingProduct(p)} className="text-blue-500 hover:underline">Edit</button>
                      <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:underline">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders */}
      {tab === 'orders' && (
        <div>
          <h3 className="text-xl font-semibold mb-3">Pesanan</h3>
          <div className="space-y-4">
            {orders.map(o => (
              <div key={o.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Order #{o.id}</h4>
                  <p className="text-primary font-semibold">{o.status}</p>
                </div>
                <p className="text-gray-600 text-sm">Total: Rp {o.total}</p>
                <p className="text-sm text-gray-500">Pembeli: {o.full_name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {tab === 'categories' && (
        <div>
          <h3 className="text-xl font-semibold mb-3">Kelola Kategori</h3>

          {/* Add Category Form */}
          <form onSubmit={addCategory} className="bg-white shadow-md rounded-lg p-4 md:p-6 mb-6 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                placeholder="Nama Kategori (e.g. Baju, Celana)"
                className="border rounded-lg p-2"
                value={newCategory.name}
                onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                required
              />
              <input
                placeholder="Deskripsi (Opsional)"
                className="border rounded-lg p-2"
                value={newCategory.description}
                onChange={e => setNewCategory({...newCategory, description: e.target.value})}
              />
            </div>
            <button className="bg-primary text-white py-2 rounded-lg hover:opacity-90 transition w-full md:w-auto px-6">
              Tambah Kategori
            </button>
          </form>

          {/* Edit Category Modal */}
          {editingCategory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h4 className="text-xl font-bold mb-4">Edit Kategori</h4>
                <form onSubmit={updateCategory} className="space-y-3">
                  <input
                    placeholder="Nama Kategori"
                    className="w-full border rounded-lg p-2"
                    value={editingCategory.name}
                    onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                    required
                  />
                  <input
                    placeholder="Deskripsi"
                    className="w-full border rounded-lg p-2"
                    value={editingCategory.description || ''}
                    onChange={e => setEditingCategory({...editingCategory, description: e.target.value})}
                  />
                  <div className="flex gap-2 pt-4 border-t">
                    <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg hover:opacity-90">
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-pink-50">
                  <tr>
                    <th className="p-3 text-left text-sm md:text-base">Nama</th>
                    <th className="p-3 text-left text-sm md:text-base">Deskripsi</th>
                    <th className="p-3 text-left text-sm md:text-base">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id} className="border-b">
                      <td className="p-3 text-sm md:text-base font-semibold">{cat.name}</td>
                      <td className="p-3 text-sm md:text-base text-gray-600">{cat.description || '-'}</td>
                      <td className="p-3 space-x-2">
                        <button
                          onClick={() => setEditingCategory(cat)}
                          className="text-blue-500 hover:underline text-sm md:text-base transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          className="text-red-500 hover:underline text-sm md:text-base transition"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {categories.length === 0 && (
              <p className="text-center text-gray-500 py-6">Belum ada kategori yang dibuat</p>
            )}
          </div>
        </div>
      )}

      {/* Coupons */}
      {tab === 'coupons' && (
        <div>
          <h3 className="text-xl font-semibold mb-3">Kelola Kupon</h3>

              {/* Add Coupon Form */}
              <form onSubmit={addCoupon} className="bg-white shadow-md rounded-lg p-4 md:p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input 
              placeholder="Kode Kupon (e.g. DISKON20)" 
              className="border rounded-lg p-2" 
              value={newCoupon.code} 
              onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} 
              required 
            />
            <input 
              placeholder="Diskon (%)" 
              type="number" 
              min="1" 
              max="100"
              className="border rounded-lg p-2" 
              value={newCoupon.discount_percent} 
              onChange={e => setNewCoupon({...newCoupon, discount_percent: e.target.value})} 
              required 
            />
            <input 
              placeholder="Maksimal Penggunaan" 
              type="number" 
              min="1"
              className="border rounded-lg p-2" 
              value={newCoupon.max_usage} 
              onChange={e => setNewCoupon({...newCoupon, max_usage: e.target.value})} 
              required 
            />
            <button className="bg-primary text-white py-2 rounded-lg col-span-3 hover:opacity-90">Tambah Kupon</button>
          </form>

          {/* Coupons List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-pink-50">
                <tr>
                  <th className="p-3 text-left">Kode</th>
                  <th className="p-3 text-left">Diskon</th>
                  <th className="p-3 text-left">Max Penggunaan</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id} className="border-b">
                    <td className="p-3">
                      <span className="font-semibold font-mono bg-gray-100 px-2 py-1 rounded">{c.code}</span>
                    </td>
                    <td className="p-3">{c.discount_percent}%</td>
                    <td className="p-3">{c.max_usage}x</td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.active ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={() => toggleCouponStatus(c.id, c.active)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${c.active ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-primary text-white hover:opacity-90'}`}
                      >
                        {c.active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {coupons.length === 0 && (
              <p className="text-center text-gray-500 py-6">Belum ada kupon yang dibuat</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
