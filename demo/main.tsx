import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { OpenSeadragonViewer, TileSource } from '../src/main.tsx'

function App() {
  return (
    <OpenSeadragonViewer viewerConfig={{ bounds: [2943, 1425, 1900, 1900]}} style={{ width: 500, height: 500 }}>
      <TileSource key="a" tileSource={"https://stacks.stanford.edu/image/iiif/kj040zn0537/T0000001/info.json"} fitBounds={[0,0,8272,6128]}/>
    </OpenSeadragonViewer>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
