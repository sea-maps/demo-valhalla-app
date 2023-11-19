import React, { useState, useRef } from 'react'

import PropTypes from 'prop-types'
import { Search, Icon, Button } from 'semantic-ui-react'
import { useSelector } from 'react-redux'
import _debounce from 'lodash/debounce'
import { useQuery } from '@tanstack/react-query'
import { searchGeocode, parseGeocodeResponse } from '../utils/pelias'
import { useDispatch } from 'react-redux'
import L from 'leaflet'
import { Box } from '@mui/material'
import ExtraMarkers from 'Map/extraMarkers'

import { makeRequest, updateWaypoint } from 'actions/directionsActionsV2'

const useSearchGeocode = (searchInput) => {
  const result = useQuery({
    queryKey: ['searchGeocode', searchInput],
    queryFn: async () => {
      const resp = await searchGeocode(searchInput)
      return parseGeocodeResponse(resp)
    },
    enabled: !!searchInput,
  })

  return result
}

const resultRenderer = (item) => {
  return (
    <div className="flex-column">
      <span className="title">{item.label}</span>
    </div>
  )
}

const AutocompleteSearch = ({
  showDirections = false,
  showCurrentLocation = false,
  indexKey = 0,
}) => {
  const map = useSelector((state) => {
    return state.common.map
  })

  const currentLocationRef = useRef(null)

  const dispatch = useDispatch()
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debounceSearchTerm, setDebounceSearchTerm] = useState('')

  const { data, isFetching } = useSearchGeocode(debounceSearchTerm)

  const fetchSuggestionsDebounced = _debounce(async (value) => {
    setDebounceSearchTerm(value)
  }, 300) // Adjust debounce timing as needed (300ms in this example)

  // Function to handle search term change
  const onSearchChange = async (e, { value }) => {
    setSearchTerm(value)
    fetchSuggestionsDebounced(value)
  }

  const onResultSelect = (event, data) => {
    const selectedItem = data.result

    setSearchTerm(selectedItem.label)
    setOpen(false)

    dispatch(
      updateWaypoint({
        waypoint: selectedItem,
        index: indexKey,
      })
    )
    dispatch(makeRequest())
  }

  const pointingToCurrentPosition = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const latit = position.coords.latitude
        const longit = position.coords.longitude
        // this is just a marker placed in that position
        console.log('position', position)

        const isoMarker = ExtraMarkers.icon({
          icon: 'fa-number',
          markerColor: 'blue',
          shape: 'circle',
          prefix: 'fa',
          iconColor: 'white',
          number: (indexKey + 1).toString(),
        })

        if (currentLocationRef.current) {
          map.removeLayer(currentLocationRef.current)
        }

        currentLocationRef.current = L.marker(
          [position.coords.latitude, position.coords.longitude],
          {
            icon: isoMarker,
          }
        ).addTo(map)

        // move the map to have the location in its center
        map.panTo(new L.LatLng(latit, longit))
      })
    }
  }

  return (
    <Box display={'flex'}>
      <Search
        size="small"
        fluid
        input={{ icon: 'search', iconPosition: 'left' }}
        onSearchChange={onSearchChange}
        onResultSelect={onResultSelect}
        resultRenderer={resultRenderer}
        type="text"
        showNoResults={false}
        open={open}
        onFocus={() => setOpen(true)}
        onMouseDown={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        loading={isFetching}
        results={data}
        value={searchTerm}
        placeholder="Hit enter for search..."
      />

      {showDirections && (
        <Button icon color="blue" style={{ marginLeft: 4 }}>
          <Icon color="white" name="location arrow" />
        </Button>
      )}
      {showCurrentLocation && (
        <Button
          onClick={pointingToCurrentPosition}
          icon
          color="blue"
          style={{ marginLeft: 4 }}
        >
          <Icon color="white" name="crosshairs" />
        </Button>
      )}
    </Box>
  )
}

AutocompleteSearch.propTypes = {
  showDirections: PropTypes.bool,
  showCurrentLocation: PropTypes.bool,
  indexKey: PropTypes.number.isRequired,
}

export default AutocompleteSearch
