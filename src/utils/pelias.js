import axios from 'axios'

export const PELIAS_URL = `${process.env.REACT_APP_PELIAS_URL}/v1/autocomplete`
export const PELIASE_URL_REVERSE = `${process.env.REACT_APP_PELIAS_URL}/v1/reverse`

/* Check if string is a valid latitude and longitude  */
export function checkIfValidLatLng(str) {
  // Regular expression to check if string is a latitude and longitude
  const regexExp = /^((\-?|\+?)?\d+(\.\d+)?),\s*((\-?|\+?)?\d+(\.\d+)?)$/gi

  return regexExp.test(str)
}

export const searchGeocode = async (userInput) => {
  if (!userInput) {
    return
  }
  return await axios.get(PELIAS_URL, {
    params: { text: userInput, size: 5 },
  })
}

export const reverseGeocode = async ({ lat, lng }) => {
  if (!lat || !lng) {
    return
  }
  return await axios.get(PELIASE_URL_REVERSE, {
    params: {
      'point.lat': lat,
      'point.lon': lng,
      size: 5,
    },
  })
}

export const parseGeocodeResponse = (resp) => {
  const processedResults = resp.data.features.map((feature) => {
    const res = {
      x: feature.geometry.coordinates[0],
      y: feature.geometry.coordinates[1],
      label: feature.properties.label,
      bounds: null,
      raw: feature,
    }

    // bbox values are only available for features derived from non-point geometries
    // geojson bbox format: [minX, minY, maxX, maxY]
    if (Array.isArray(feature.bbox) && feature.bbox.length === 4) {
      res.bounds = [
        [feature.bbox[1], feature.bbox[0]], // s, w
        [feature.bbox[3], feature.bbox[2]], // n, e
      ]
    }

    return res
  })

  return processedResults
}
