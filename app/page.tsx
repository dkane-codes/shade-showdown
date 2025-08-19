import Link from 'next/link'
import { NoteIcon, PaintBoardIcon } from 'hugeicons-react'

export default function HomePage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold mb-6 text-black text-center">
          Welcome to Shade Showdown
        </h1>
        
        <p className="text-xl text-black mb-8 text-center font-medium">
          Vote on colors using the Keep, Trade, Cut system to determine the most popular shades!
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="card-glassy">
            <h2 className="text-2xl font-bold mb-4 text-black flex items-center">
              <NoteIcon size={28} color="black" strokeWidth={2} className="mr-3" />
              Start Voting
            </h2>
            <p className="text-black mb-6 font-medium">
              Choose your favorite colors by selecting Keep, Trade, or Cut for sets of three colors.
            </p>
            <Link 
              href="/vote"
              className="btn-primary"
            >
              Start Voting
            </Link>
          </div>

          <div className="card-glassy">
            <h2 className="text-2xl font-bold mb-4 text-black flex items-center">
              <PaintBoardIcon size={28} color="black" strokeWidth={2} className="mr-3" />
              Browse Colors
            </h2>
            <p className="text-black mb-6 font-medium">
              Explore all available colors in our collection of trending 2025 shades.
            </p>
            <Link 
              href="/colors"
              className="btn-primary whitespace-nowrap"
            >
              View All Colors
            </Link>
          </div>
        </div>

        <div className="mt-12 card-glassy">
          <h3 className="text-2xl font-bold mb-6 text-black">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="bg-white/30 backdrop-blur-sm p-4 rounded-lg border border-white/40">
              <strong className="text-green-600 font-bold">Keep:</strong> 
              <span className="text-black"> This color is your favorite from the three</span>
            </div>
            <div className="bg-white/30 backdrop-blur-sm p-4 rounded-lg border border-white/40">
              <strong className="text-yellow-600 font-bold">Trade:</strong> 
              <span className="text-black"> This color is okay, but you might swap it</span>
            </div>
            <div className="bg-white/30 backdrop-blur-sm p-4 rounded-lg border border-white/40">
              <strong className="text-red-600 font-bold">Cut:</strong> 
              <span className="text-black"> This color is your least favorite</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}