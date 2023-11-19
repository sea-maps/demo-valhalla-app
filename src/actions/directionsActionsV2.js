import axios from 'axios'
import {
  RECEIVE_GEOCODE_RESULTS,
  REQUEST_GEOCODE_RESULTS,
  UPDATE_TEXTINPUT,
  EMPTY_WAYPOINT,
  CLEAR_WAYPOINTS,
  RECEIVE_ROUTE_RESULTS,
  CLEAR_ROUTES,
  TOGGLE_PROVIDER_ISO,
  HIGHLIGHT_MNV,
  UPDATE_WAYPOINT,
  INSERT_WAYPOINT,
  ADD_WAYPOINT,
} from './types'

import { reverseGeocode, parseGeocodeResponse } from 'utils/pelias'

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

export const doAddWaypoint = (doInsert) => (dispatch, getState) => {
  const emptyWp = {
    x: 0,
    y: 0,
    raw: undefined,
    label: '',
  }
  if (doInsert) {
    dispatch(insertWaypoint(emptyWp))
  } else {
    dispatch(addWaypoint(emptyWp))
  }
}

const insertWaypoint = (waypoint) => ({
  type: INSERT_WAYPOINT,
  payload: waypoint,
})

export const addWaypoint = (waypoint) => ({
  type: ADD_WAYPOINT,
  payload: waypoint,
})

export const makeRequest = () => (dispatch, getState) => {
  dispatch(updatePermalink())
  const { waypoints = [] } = getState().directionsV2
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

  console.log('valhallaRequest', valhallaRequest)

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
      console.log('data', data)
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

export const clearWaypoints = (index) => ({
  type: CLEAR_WAYPOINTS,
  payload: { index: index },
})

export const emptyWaypoint = (index) => ({
  type: EMPTY_WAYPOINT,
  payload: { index: index },
})

export const doRemoveWaypoint = (index) => (dispatch, getState) => {
  if (index === undefined) {
    dispatch(clearWaypoints())
  } else {
    const waypoints = getState().directionsV2.waypoints
    if (waypoints.length > 2) {
      dispatch(clearWaypoints(index))
      dispatch(makeRequest())
    } else {
      dispatch(emptyWaypoint(index))
    }
  }
  dispatch(updatePermalink())
}

export const fetchReverseGeocodePerma = (object) => (dispatch) => {
  dispatch(requestGeocodeResults({ index: object.index, reverse: true }))
  console.log('object', object)
  const { index, permaLast, latLng } = object
  const { lng, lat } = latLng

  if (index > 1) {
    dispatch(doAddWaypoint(true, permaLast))
  }

  reverseGeocode({ lng, lat })
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
  const { index } = object
  const { lng, lat } = object.latLng

  return reverseGeocode({ lng, lat })
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

    if (reverse) {
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

export const isWaypoint = (index) => (dispatch, getState) => {
  const waypoints = getState().directionsV2.waypoints
  if (waypoints[index].geocodeResults.length > 0) {
    dispatch(clearRoutes(VALHALLA_OSM_URL))
  }
}

export const highlightManeuver = (fromTo) => (dispatch, getState) => {
  const highlightSegment = getState().directionsV2.highlightSegment
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
