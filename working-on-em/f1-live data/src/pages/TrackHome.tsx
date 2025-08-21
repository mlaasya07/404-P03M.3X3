import React, { useEffect, useRef, useState } from 'react'

type DriverPos = { id: string; driver: string; constructor?: string; x: number; y: number; gap?: string; lastLap?: string; tyre?: string; pit?: boolean }

export default function TrackHome({ wsUrl = 'ws://localhost:8080' }: { wsUrl?: string }){
  const [ws, setWs] = useState<WebSocket| null>(null)
  const [connected, setConnected] = useState(false)
  const [positions, setPositions] = useState<DriverPos[]>([])
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const viewW = 1600, viewH = 800

  useEffect(()=>{ connect(); return ()=>disconnect() }, [wsUrl])

  function connect(){
    disconnect()
    try{
      const s = new WebSocket(wsUrl)
      s.onopen = ()=>{ setConnected(true); console.info('ws open') }
      s.onclose = ()=>{ setConnected(false); console.info('ws close') }
      s.onerror = (e)=>{ console.error('ws err', e); setConnected(false) }
      s.onmessage = (ev)=>{
        try{
          const m = JSON.parse(ev.data)
          if(m.type==='positions' && Array.isArray(m.data)){ setPositions(m.data); setLastUpdate(Date.now()) }
        }catch(e){console.error(e)}
      }
      setWs(s)
    }catch(e){console.error(e)}
  }
  function disconnect(){ if(ws){ ws.close(); setWs(null); setConnected(false) } }

  function normalizedToSvg(x:number,y:number){ const cx = x*viewW; const cy=y*viewH; return {cx,cy} }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-3xl font-extrabold">Monaco GP — Live Track</h1>
          <div className="text-xs text-zinc-400">Status: {connected ? <span className="text-emerald-400">Live</span> : <span className="text-red-400">Disconnected</span>} • Last: {lastUpdate?new Date(lastUpdate).toLocaleTimeString():'—'}</div>
        </div>
        <div className="flex items-center gap-2">
          <input defaultValue={wsUrl} onBlur={(e)=>{ const v=(e.target as HTMLInputElement).value; disconnect(); setTimeout(()=>{ new WebSocket(v) },100) }} className="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded text-sm w-64" />
          <button onClick={()=>{ if(!connected) connect(); else disconnect() }} className={`px-3 py-2 rounded ${connected? 'bg-emerald-600':'bg-red-600'}`}>{connected? 'Disconnect':'Connect'}</button>
        </div>
      </div>

      <div className="bg-zinc-900/30 rounded-2xl p-3">
        <div className="w-full h-[650px] relative rounded overflow-hidden">
          <svg ref={svgRef} viewBox={`0 0 ${viewW} ${viewH}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full block">
            <rect width="100%" height="100%" fill="#071019" />

            {/* Simplified Monaco-style curve path (placeholder); replace with official SVG for fidelity */}
            <g stroke="#ff4d4d" strokeWidth="10" fill="none">
              <path d="M120 400 C230 220 420 220 540 400 C660 580 900 580 1020 400 C1140 220 1360 220 1480 400" />
            </g>

          </svg>

          {/* Absolute marker layer */}
          {positions.map(p=>{
            const {cx,cy}=normalizedToSvg(p.x,p.y)
            const left = (cx/viewW)*100
            const top = (cy/viewH)*100
            return (
              <div key={p.id} style={{left:`${left}%`, top:`${top}%`, transform:'translate(-50%,-50%)', position:'absolute', transition:'transform 800ms linear'}} title={`${p.driver} • ${p.constructor} • Last:${p.lastLap||'—'}`}>
                <div style={{width:32,height:32,borderRadius:999,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,background:p.pit? '#ff4d4d':'#fff', color:p.pit? '#fff':'#000'}}>{p.id}</div>
                <div style={{fontSize:10,color:'#9ca3af',textAlign:'center',marginTop:4}}>{p.gap||''}</div>
              </div>
            )
          })}

        </div>
      </div>
    </div>
  )
}