import React from 'react'
export default function About(){
  return (<div><h2 className="text-2xl font-bold mb-4">About This Web App</h2><p className="text-sm text-zinc-400">This app expects a WebSocket backend that streams live F1 positions with normalized x,y coordinates mapping to the track SVG. For full telemetry use FastF1 and the included Python bridge.</p></div>)
}