import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-gray-800">
          Welcome to Shade Showdown
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Vote on colors using the Keep, Trade, Cut system to determine the most popular shades!
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">🗳️ Start Voting</h2>
            <p className="text-gray-600 mb-4">
              Choose your favorite colors by selecting Keep, Trade, or Cut for sets of three colors.
            </p>
            <Link 
              href="/vote"
              className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Voting
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">🎨 Browse Colors</h2>
            <p className="text-gray-600 mb-4">
              Explore all available colors in our collection of trending 2025 shades.
            </p>
            <Link 
              href="/colors"
              className="inline-block bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              View All Colors
            </Link>
          </div>
        </div>

        <div className="mt-12 bg-gray-100 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-3 text-gray-800">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <strong className="text-green-600">Keep:</strong> This color is your favorite from the three
            </div>
            <div>
              <strong className="text-yellow-600">Trade:</strong> This color is okay, but you might swap it
            </div>
            <div>
              <strong className="text-red-600">Cut:</strong> This color is your least favorite
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}