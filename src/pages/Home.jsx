import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="text-center py-20 bg-gradient-to-b from-pink-50 to-white">
      <h1 className="text-4xl md:text-5xl font-bold text-primary">Welcome to Bagong Store 💖</h1>
      <p className="text-gray-600 mt-3 text-lg">Tempat belanja kece dengan vibes estetik</p>
      <Link to="/products" className="inline-block mt-6 px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow hover:opacity-90">
        Mulai Belanja
      </Link>
    </div>
  )
}
