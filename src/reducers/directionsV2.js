import {
  ADD_WAYPOINT,
  INSERT_WAYPOINT,
  SET_WAYPOINT,
  CLEAR_WAYPOINTS,
  EMPTY_WAYPOINT,
  UPDATE_WAYPOINT,
  UPDATE_TEXTINPUT,
  REQUEST_GEOCODE_RESULTS,
  RECEIVE_GEOCODE_RESULTS,
  RECEIVE_ROUTE_RESULTS,
  CLEAR_ROUTES,
  TOGGLE_PROVIDER_ISO,
  HIGHLIGHT_MNV,
  ZOOM_TO_MNV,
  UPDATE_INCLINE_DECLINE,
} from 'actions/types'

import { VALHALLA_OSM_URL } from '../utils/valhalla'

const initialState = {
  successful: false,
  highlightSegment: {
    startIndex: -1,
    endIndex: -1,
  },
  waypoints: [],
  zoomObj: {
    index: -1,
    timeNow: -1,
  },
  selectedAddresses: '',
  results: {
    [VALHALLA_OSM_URL]: {
      data: {},
      show: true,
    },
  },
}

export const directions = (state = initialState, action) => {
  // console.log(action) //eslint-disable-line
  switch (action.type) {
    case UPDATE_INCLINE_DECLINE:
      return {
        ...state,
        inclineDeclineTotal: { ...action.payload },
      }

    case TOGGLE_PROVIDER_ISO:
      return {
        ...state,
        results: {
          ...state.results,
          [action.payload.provider]: {
            ...state.results[action.payload.provider],
            show: action.payload.show,
          },
        },
      }

    case CLEAR_ROUTES:
      return {
        ...state,
        successful: false,
        inclineDeclineTotal: undefined,
        results: {
          ...state.results,
          [action.payload]: {
            ...state.results[action.payload],
            data: {},
          },
        },
      }

    case RECEIVE_ROUTE_RESULTS:
      return {
        ...state,
        inclineDeclineTotal: undefined,
        results: {
          ...state.results,
          [action.payload.provider]: {
            ...state.results[action.payload.provider],
            data: action.payload.data,
          },
        },
        successful: true,
      }

    case RECEIVE_GEOCODE_RESULTS:
      return {
        ...state,
        waypoints: state.waypoints.map((waypoint, i) =>
          i === action.payload.index
            ? {
                ...waypoint,
                isFetching: false,
                results: action.payload.results,
              }
            : waypoint
        ),
      }

    case REQUEST_GEOCODE_RESULTS:
      return {
        ...state,
        waypoints: state.waypoints.map((waypoint, i) =>
          i === action.payload.index
            ? { ...waypoint, isFetching: true }
            : waypoint
        ),
      }

    case UPDATE_TEXTINPUT: {
      const newWaypoints = JSON.parse(JSON.stringify(state.waypoints)) || []

      newWaypoints[action.payload.index] = {
        ...(newWaypoints[action.payload.index] || {}),
        results: action.payload.results || [],
      }

      return {
        ...state,
        waypoints: newWaypoints,
      }
    }
    case CLEAR_WAYPOINTS: {
      return {
        ...state,
        waypoints:
          action.payload.index >= 0
            ? state.waypoints.filter((v, i) => i !== action.payload.index)
            : [],
      }
    }

    case EMPTY_WAYPOINT: {
      return {
        ...state,
        waypoints: state.waypoints.map((waypoint, i) =>
          i === action.payload.index
            ? {
                ...waypoint,
                userInput: '',
                geocodeResults: [],
              }
            : waypoint
        ),
      }
    }

    case UPDATE_WAYPOINT: {
      const newWaypoints = JSON.parse(JSON.stringify(state.waypoints)) || []
      newWaypoints[action.payload.index] = action.payload.waypoint

      return {
        ...state,
        waypoints: newWaypoints,
      }
    }

    case SET_WAYPOINT: {
      return {
        ...state,
        waypoints: action.payload,
      }
    }

    case ADD_WAYPOINT: {
      return {
        ...state,
        waypoints: [...state.waypoints, action.payload],
      }
    }

    case INSERT_WAYPOINT: {
      const waypoints = state.waypoints
      waypoints.splice(waypoints.length - 1, 0, action.payload)

      return {
        ...state,
        waypoints: [...waypoints],
      }
    }

    case HIGHLIGHT_MNV: {
      return {
        ...state,
        highlightSegment: action.payload,
      }
    }

    case ZOOM_TO_MNV: {
      return {
        ...state,
        zoomObj: action.payload,
      }
    }

    default: {
      return state
    }
  }
}
