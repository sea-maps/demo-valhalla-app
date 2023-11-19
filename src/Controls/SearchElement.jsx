import React, { useState, useRef, useEffect } from 'react'

import PropTypes from 'prop-types'
import { Search, Icon, Button } from 'semantic-ui-react'
import { useSelector } from 'react-redux'
import _debounce from 'lodash/debounce'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  searchGeocode,
  parseGeocodeResponse,
  checkIfValidLatLng,
  reverseGeocode,
} from '../utils/pelias'
import { useDispatch } from 'react-redux'
import L from 'leaflet'
import { Box } from '@mui/material'
import ExtraMarkers from 'Map/extraMarkers'

import { makeRequest, updateWaypoint } from 'actions/directionsActionsV2'

const useSearchGeocode = (searchInput) => {
  const result = useQuery({
    queryKey: ['searchGeocode', searchInput],
    queryFn: async () => {
      const isLatLng = checkIfValidLatLng(searchInput)
      if (isLatLng) {
        const [lat, lng] = searchInput.split(',')
        const resp = await reverseGeocode({ lat, lng })
        return parseGeocodeResponse(resp)
      }

      const resp = await searchGeocode(searchInput)
      return parseGeocodeResponse(resp)
    },
    enabled: !!searchInput,
  })

  return result
}

const useFetchReserveGeocode = () => {
  const queryClient = useQueryClient()

  const fetchReserveGeocode = async ({ lat, lng }) => {
    return await queryClient.fetchQuery({
      queryKey: ['searchGeocode', { lat, lng }],
      queryFn: async () => {
        const resp = await reverseGeocode({ lat, lng })
        return parseGeocodeResponse(resp)
      },
    })
  }

  return fetchReserveGeocode
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

  const currentLocationRef = useRef(null)

  const dispatch = useDispatch()
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debounceSearchTerm, setDebounceSearchTerm] = useState('')

  const { data, isFetching } = useSearchGeocode(debounceSearchTerm)
  const fetchReserveGeocode = useFetchReserveGeocode()

  const fetchSuggestionsDebounced = _debounce(async (value) => {
    setDebounceSearchTerm(value)
  }, 300) // Adjust debounce timing as needed (300ms in this example)

  // Function to handle search term change
  const onSearchChange = async (_, { value }) => {
    setSearchTerm(value)
    fetchSuggestionsDebounced(value)
  }

  const onResultSelect = (event, data) => {
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

    console.log('data.results', data.results)
    dispatch(
      updateWaypoint({
        waypoint: {
          ...selectedItem,
          results: data.results.slice(0, 5),
        },
        index: indexKey,
      })
    )
    dispatch(makeRequest())
  }

  const pointingToCurrentPosition = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const latit = position.coords.latitude
        const longit = position.coords.longitude

        const results = await fetchReserveGeocode({ lat: latit, lng: longit })

        // default get the first item in list results
        onResultSelect(
          {},
          {
            results: results,
            result: results[0],
          }
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
        loading={isFetching}
        results={data || []}
        value={searchTerm}
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
