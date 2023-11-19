import React from 'react'

import Map from './Map/Map'
import MainControl from './Controls/MainControl'
import SettingsPanel from './Controls/settings-panel'
import 'pelias-leaflet-plugin'
import 'leaflet/dist/leaflet.css'
import { QueryClientProvider } from '@tanstack/react-query'
import 'semantic-ui-css/semantic.min.css'
import { queryClient } from './modules/react-query'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <Map />
        <MainControl />
        <SettingsPanel />
      </div>
    </QueryClientProvider>
  )
}

export default App
