import axios from 'axios'
import {
  RECEIVE_GEOCODE_RESULTS,
  REQUEST_GEOCODE_RESULTS,
  UPDATE_TEXTINPUT,
  RECEIVE_ROUTE_RESULTS,
  CLEAR_ROUTES,
  TOGGLE_PROVIDER_ISO,
  HIGHLIGHT_MNV,
  UPDATE_WAYPOINT,
} from './types'

import {
  searchGeocode,
  reverseGeocode,
  parseGeocodeResponse,
} from 'utils/pelias'

import {
  VALHALLA_OSM_URL,
  buildDirectionsRequest,
  parseDirectionsGeometry,
} from 'utils/valhalla'

import {
  sendMessage,
  showLoading,
  filterProfileSettings,
  updatePermalink,
  zoomTo,
} from './commonActions'

const serverMapping = {
  [VALHALLA_OSM_URL]: 'OSM',
}

export const makeRequest = () => (dispatch, getState) => {
  dispatch(updatePermalink())
  const { waypoints } = getState().directionsV2
  const { profile } = getState().common
  let { settings } = getState().common

  if (waypoints.length >= 2) {
    settings = filterProfileSettings(profile, settings)
    const valhallaRequest = buildDirectionsRequest({
      profile,
      activeWaypoints: waypoints,
      settings,
    })
    dispatch(fetchValhallaDirections(valhallaRequest))
  }
}

const fetchValhallaDirections = (valhallaRequest) => (dispatch) => {
  dispatch(showLoading(true))

  const config = {
    params: { json: JSON.stringify(valhallaRequest.json) },
    headers: {
      'Content-Type': 'application/json',
    },
  }
  axios
    .get(VALHALLA_OSM_URL + '/route', config)
    .then(({ data }) => {
      data.decodedGeometry = parseDirectionsGeometry(data)
      dispatch(registerRouteResponse(VALHALLA_OSM_URL, data))
      dispatch(zoomTo(data.decodedGeometry))
    })
    .catch(({ response }) => {
      let error_msg = response.data.error
      if (response.data.error_code === 154) {
        error_msg += ` for ${valhallaRequest.json.costing}.`
      }
      dispatch(clearRoutes(VALHALLA_OSM_URL))
      dispatch(
        sendMessage({
          type: 'warning',
          icon: 'warning',
          description: `${serverMapping[VALHALLA_OSM_URL]}: ${error_msg}`,
          title: `${response.data.status}`,
        })
      )
    })
    .finally(() => {
      setTimeout(() => {
        dispatch(showLoading(false))
      }, 500)
    })
}

export const registerRouteResponse = (provider, data) => ({
  type: RECEIVE_ROUTE_RESULTS,
  payload: {
    provider,
    data,
  },
})

export const clearRoutes = (provider) => ({
  type: CLEAR_ROUTES,
  payload: provider,
})

const placeholderAddress = (index, lng, lat) => (dispatch) => {
  // placeholder until geocoder is complete
  // will add latLng to input field
  const addresses = [
    {
      title: '',
      displaylnglat: [lng, lat],
      key: index,
    },
  ]
  dispatch(receiveGeocodeResults({ addresses, index: index }))
  dispatch(
    updateTextInput({
      inputValue: [lng.toFixed(6), lat.toFixed(6)].join(', '),
      index: index,
    })
  )
}

export const fetchReverseGeocodePerma = (object) => (dispatch) => {
  dispatch(requestGeocodeResults({ index: object.index, reverse: true }))

  const { index } = object
  const { permaLast } = object
  const { lng, lat } = object.latLng

  if (index > 1) {
    dispatch(doAddWaypoint(true, permaLast))
  }

  reverseGeocode(lng, lat)
    .then((response) => {
      dispatch(
        processGeocodeResponse(response, index, true, [lng, lat], permaLast)
      )
    })
    .catch((error) => {
      console.log(error) //eslint-disable-line
    })
  // .finally(() => {
  //   // always executed
  // })
}

export const fetchReverseGeocode = (object) => (dispatch, getState) => {
  //dispatch(requestGeocodeResults({ index: object.index, reverse: true }))
  const { waypoints } = getState().directions

  let { index } = object
  const { fromDrag } = object
  const { lng, lat } = object.latLng

  if (index === -1) {
    index = waypoints.length - 1
  } else if (index === 1 && !fromDrag) {
    // insert waypoint from context menu
    dispatch(doAddWaypoint(true))

    index = waypoints.length - 2
  }

  dispatch(placeholderAddress(index, lng, lat))

  dispatch(requestGeocodeResults({ index, reverse: true }))

  reverseGeocode(lng, lat)
    .then((response) => {
      dispatch(processGeocodeResponse(response, index, true, [lng, lat]))
    })
    .catch((error) => {
      console.log(error) //eslint-disable-line
    })
  // .finally(() => {
  //   // always executed
  // })
}

export const fetchGeocode = (object) => (dispatch) => {
  if (object.lngLat) {
    const addresses = [
      {
        title: object.lngLat.toString(),
        description: '',
        selected: false,
        addresslnglat: object.lngLat,
        sourcelnglat: object.lngLat,
        displaylnglat: object.lngLat,
        key: object.index,
      },
    ]
    dispatch(receiveGeocodeResults({ addresses, index: object.index }))
  } else {
    dispatch(requestGeocodeResults({ index: object.index }))

    searchGeocode(object.inputValue)
      .then((response) => {
        dispatch(processGeocodeResponse(response, object.index))
      })
      .catch((error) => {
        console.log(error) //eslint-disable-line
      })
      .finally(() => {})
  }
}

const processGeocodeResponse =
  (resp, index, reverse, lngLat, permaLast) => (dispatch) => {
    const processedResults = parseGeocodeResponse(resp)
    // if no address can be found
    if (processedResults.length === 0) {
      dispatch(
        sendMessage({
          type: 'warning',
          icon: 'warning',
          description: 'Sorry, no addresses can be found.',
          title: 'No addresses',
        })
      )
    }
    dispatch(receiveGeocodeResults({ addresses: processedResults, index }))

    if (reverse) {
      dispatch(
        updateTextInput({
          inputValue: processedResults[0].label,
          index: index,
        })
      )
      if (permaLast === undefined) {
        dispatch(makeRequest())
        dispatch(updatePermalink())
      } else if (permaLast) {
        dispatch(makeRequest())
        dispatch(updatePermalink())
      }
    }
  }

export const receiveGeocodeResults = (object) => ({
  type: RECEIVE_GEOCODE_RESULTS,
  payload: object,
})

export const requestGeocodeResults = (object) => ({
  type: REQUEST_GEOCODE_RESULTS,
  payload: object,
})

export const updateTextInput = (object) => ({
  type: UPDATE_TEXTINPUT,
  payload: object,
})

export const doRemoveWaypoint = (index) => (dispatch, getState) => {
  if (index === undefined) {
    dispatch(clearWaypoints())
    Array(2)
      .fill()
      .map((_, i) => dispatch(doAddWaypoint()))
  } else {
    let waypoints = getState().directions.waypoints
    if (waypoints.length > 2) {
      dispatch(clearWaypoints(index))
      dispatch(makeRequest())
    } else {
      dispatch(emptyWaypoint(index))
    }
    waypoints = getState().directions.waypoints
    if (getActiveWaypoints(waypoints).length < 2) {
      dispatch(clearRoutes(VALHALLA_OSM_URL))
    }
  }
  dispatch(updatePermalink())
}

export const isWaypoint = (index) => (dispatch, getState) => {
  const waypoints = getState().directions.waypoints
  if (waypoints[index].geocodeResults.length > 0) {
    dispatch(clearRoutes(VALHALLA_OSM_URL))
  }
}

export const highlightManeuver = (fromTo) => (dispatch, getState) => {
  const highlightSegment = getState().directions.highlightSegment
  // this is dehighlighting
  if (
    highlightSegment.startIndex === fromTo.startIndex &&
    highlightSegment.endIndex === fromTo.endIndex
  ) {
    fromTo.startIndex = -1
    fromTo.endIndex = -1
  }

  dispatch({
    type: HIGHLIGHT_MNV,
    payload: fromTo,
  })
}

export const updateWaypoint = ({ waypoint, index }) => ({
  type: UPDATE_WAYPOINT,
  payload: { waypoint, index },
})

export const showProvider = (provider, show) => ({
  type: TOGGLE_PROVIDER_ISO,
  payload: {
    provider,
    show,
  },
})
