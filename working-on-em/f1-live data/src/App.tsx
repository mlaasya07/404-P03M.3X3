import React from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import TrackHome from './pages/TrackHome'
import Players from './pages/Players'
import Winners from './pages/Winners'
import About from './pages/About'

export default function App(){
  return (
    <Router>
      <div className="min-h-screen text-zinc-100 font-robotoMono">
        <nav className="bg-zinc-900 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-2xl font-bold text-red-500">🏁 F1 Live</div>
              <NavLink to="/" className={({isActive})=>`px-2 py-1 rounded ${isActive?'bg-zinc-800':'hover:bg-zinc-800'}`}>HOME</NavLink>
              <NavLink to="/players" className={({isActive})=>`px-2 py-1 rounded ${isActive?'bg-zinc-800':'hover:bg-zinc-800'}`}>PLAYERS</NavLink>
              <NavLink to="/winners" className={({isActive})=>`px-2 py-1 rounded ${isActive?'bg-zinc-800':'hover:bg-zinc-800'}`}>WINNERS</NavLink>
              <NavLink to="/about" className={({isActive})=>`px-2 py-1 rounded ${isActive?'bg-zinc-800':'hover:bg-zinc-800'}`}>ABOUT</NavLink>
            </div>

            <div className="text-xs text-zinc-400">Live via WebSocket — run backend bridge and connect to ws://localhost:8080</div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<TrackHome wsUrl={'ws://localhost:8080'} />} />
            <Route path="/players" element={<Players />} />
            <Route path="/winners" element={<Winners />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}