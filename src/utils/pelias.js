import { PeliasProvider } from 'leaflet-geosearch'
import axios from 'axios'

export const PELIAS_URL = `${process.env.REACT_APP_PELIAS_URL}/v1/autocomplete`
export const PELIASE_URL_REVERSE = `${process.env.REACT_APP_PELIAS_URL}/reverse`

const peliasProvider = new PeliasProvider({
  host: process.env.REACT_APP_PELIAS_URL,
})
export const searchGeocode = async (userInput) => {
  const url = peliasProvider.endpoint({
    query: userInput,
    type: 'SEARCH',
  })

  return await axios.get(url)
}

export const reverseGeocode = async (lon, lat) => {
  const url = peliasProvider.endpoint({
    query: { lon, lat },
    type: 'REVERSE',
  })

  return await axios.get(url)
}

export const parseGeocodeResponse = (resp) => {
  const processedResults = peliasProvider.parse(resp)
  return processedResults
}
