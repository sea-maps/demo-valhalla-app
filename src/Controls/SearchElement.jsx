import React, { useState, useRef, useEffect, useCallback } from 'react'

import PropTypes from 'prop-types'
import { Search, Icon, Button } from 'semantic-ui-react'
import { useSelector } from 'react-redux'
import _debounce from 'lodash/debounce'
import { useDispatch } from 'react-redux'
import L from 'leaflet'
import { Box } from '@mui/material'
import ExtraMarkers from 'Map/extraMarkers'

import {
  makeRequest,
  updateWaypoint,
  fetchSearchGeocode as _fetchSearchGeocode,
  fetchReverseGeocode as _fetchReverseGeocode,
} from 'actions/directionsActionsV2'

const useFetchSearchGeocode = () => {
  const dispatch = useDispatch()

  const fetchSearchGeocode = (inputValue, index) => {
    dispatch(_fetchSearchGeocode({ inputValue, index }))
  }

  const debounceHandleAutocomplete = useCallback(
    _debounce(fetchSearchGeocode, 500),
    []
  )

  return debounceHandleAutocomplete
}

const useFetchReserveGeocode = () => {
  const dispatch = useDispatch()

  const fetchReverseGeocode = ({ latLng: { lat, lng }, index }, init) => {
    dispatch(_fetchReverseGeocode({ latLng: { lat, lng }, index }, init))
  }

  return fetchReverseGeocode
}

const resultRenderer = (item) => {
  return (
    <div key={`${item.y}-${item.x}`} className="flex-column">
      <span className="title">{item.label}</span>
    </div>
  )
}

const AutocompleteSearch = ({
  showDirections = false,
  showCurrentLocation = false,
  indexKey = 0,
  setShowDirections,
}) => {
  const map = useSelector((state) => {
    return state.common.map
  })

  const waypoint = useSelector((state) => {
    return state.directionsV2.waypoints[indexKey] || {}
  })

  const currentLocationRef = useRef(null)

  const dispatch = useDispatch()
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState()

  useEffect(() => {
    setSearchTerm(waypoint.inputValue)
  }, [waypoint.inputValue])

  const fetchReserveGeocode = useFetchReserveGeocode()
  const fetchSearchGeocode = useFetchSearchGeocode()

  // Function to handle search term change
  const onSearchChange = useCallback((_, { value }) => {
    setSearchTerm(value)
    fetchSearchGeocode(value, indexKey)
  }, [])

  const onResultSelect = useCallback((event, data) => {
    const selectedItem = data.result

    setSearchTerm(selectedItem.label)
    setOpen(false)

    const isoMarker = ExtraMarkers.icon({
      icon: 'fa-number',
      markerColor: 'green',
      shape: 'circle',
      prefix: 'fa',
      iconColor: 'white',
      number: (indexKey + 1).toString(),
    })

    if (currentLocationRef.current) {
      map.removeLayer(currentLocationRef.current)
    }

    currentLocationRef.current = L.marker([selectedItem.y, selectedItem.x], {
      icon: isoMarker,
    }).addTo(map)

    // move the map to have the location in its center
    map.panTo(new L.LatLng(selectedItem.y, selectedItem.x))

    dispatch(
      updateWaypoint({
        waypoint: {
          ...selectedItem,
          results: data.results.slice(0, 5),
        },
        index: indexKey,
        inputValue: selectedItem.label,
      })
    )
    dispatch(makeRequest())
  }, [])

  const pointingToCurrentPosition = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const latit = position.coords.latitude
        const longit = position.coords.longitude

        fetchReserveGeocode(
          {
            latLng: { lat: latit, lng: longit },
            index: indexKey,
          },
          true
        )
      })
    }
  }

  useEffect(() => {
    return () => {
      if (currentLocationRef.current) {
        map.removeLayer(currentLocationRef.current)
      }
    }
  }, [])

  return (
    <Box display={'flex'} width={'100%'}>
      <Search
        style={{
          flex: 1,
          flexGrow: 1,
        }}
        fluid
        input={{
          icon: 'search',
          iconPosition: 'left',
          style: {
            width: '100%',
          },
        }}
        onSearchChange={onSearchChange}
        onResultSelect={onResultSelect}
        resultRenderer={resultRenderer}
        type="text"
        showNoResults={false}
        open={open}
        onFocus={() => setOpen(true)}
        onMouseDown={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        loading={false}
        results={waypoint.results || []}
        value={searchTerm}
        defaultValue={waypoint.inputValue}
        placeholder="Hit enter for search..."
      />

      {showDirections && (
        <Button
          onClick={() => setShowDirections()}
          icon
          color="blue"
          style={{ marginLeft: 4 }}
        >
          <Icon
            style={{ transform: 'rotate(-90deg)' }}
            name="level down alternate"
          />
        </Button>
      )}
      {showCurrentLocation && !showDirections ? (
        <Button
          onClick={pointingToCurrentPosition}
          icon
          color="blue"
          style={{ marginLeft: 4 }}
        >
          <Icon name="crosshairs" />
        </Button>
      ) : null}
    </Box>
  )
}

AutocompleteSearch.propTypes = {
  showDirections: PropTypes.bool,
  showCurrentLocation: PropTypes.bool,
  indexKey: PropTypes.number.isRequired,
  setShowDirections: PropTypes.func,
}

export default AutocompleteSearch
