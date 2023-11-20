import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import SearchElement from './SearchElement'
import { Icon, Button } from 'semantic-ui-react'
import { useDispatch } from 'react-redux'
import { Box } from '@mui/material'
import {
  makeRequest,
  fetchReverseGeocodePerma,
  clearRoutes,
  doRemoveWaypoint,
  doAddWaypoint,
  updateWaypoint,
} from 'actions/directionsActionsV2'

import {
  updateProfile,
  resetSettings,
  updatePermalink,
  zoomTo,
} from 'actions/commonActions'

const pairwise = (arr, func) => {
  let cnt = 0
  for (let i = 0; i < arr.length - 1; i += 2) {
    func(arr[i], arr[i + 1], cnt)
    cnt += 1
  }
}

function MainControl() {
  const dispatch = useDispatch()

  const profile = useSelector((state) => {
    return state.common.profile
  })

  const map = useSelector((state) => {
    return state.common.map
  })
  const waypoints = useSelector((state) => {
    return state.directionsV2.waypoints || []
  })
  const [isDisplayDirection, setDisplayDirection] = useState(
    waypoints.length >= 2
  )

  const handleRemoveWaypoints = () => {
    dispatch(doRemoveWaypoint(1))
    dispatch(clearRoutes())
  }

  const handleProfile = (newProfile) => {
    dispatch(updateProfile({ profile: newProfile }))
    dispatch(resetSettings())
    dispatch(updatePermalink())
    dispatch(makeRequest())
  }

  useEffect(() => {
    const params = Object.fromEntries(new URL(document.location).searchParams)

    if ('profile' in params) {
      dispatch(updateProfile({ profile: params.profile }))
    }

    if ('wps' in params && params.wps.length > 0) {
      const coordinates = params.wps.split(',').map(Number)
      const processedCoords = []
      pairwise(coordinates, async (current, next, i) => {
        const latLng = { lat: next, lng: current }

        processedCoords.push([latLng.lat, latLng.lng])
        const payload = {
          latLng,
          fromPerma: true,
          permaLast: i === coordinates.length / 2 - 1,
          index: i,
        }

        dispatch(fetchReverseGeocodePerma(payload, true))
      })

      dispatch(zoomTo(processedCoords))
      dispatch(resetSettings())
    } else if (waypoints.length === 0) {
      Array(2)
        .fill()
        .map((_, i) => dispatch(doAddWaypoint()))
    }
  }, [])

  const onReserveWaypoints = (data = []) => {
    const [first, second] = data

    dispatch(
      updateWaypoint({
        waypoint: {
          ...first,
          inputValue: first.label,
        },
        index: 1,
      })
    )
    dispatch(
      updateWaypoint({
        waypoint: {
          ...second,
          inputValue: second.label,
        },
        index: 0,
      })
    )
    dispatch(updatePermalink())
    dispatch(makeRequest())
  }
  if (!map) {
    return null
  }

  return (
    <Box
      position={'absolute'}
      zIndex={900}
      top={16}
      left={16}
      padding={2}
      borderRadius={2}
      backgroundColor={'white'}
      width={360}
    >
      {isDisplayDirection && (
        <Box
          width={'100%'}
          display={'grid'}
          gridTemplateColumns={'40px auto'}
          gap={1}
        >
          <Box></Box>
          <Box
            display={'flex'}
            marginBottom={2}
            justifyContent={'space-between'}
          >
            <Box
              display={'grid'}
              grid={'40px 40px 40px'}
              gridTemplateColumns={'auto auto auto'}
            >
              {[
                {
                  profile: 'car',
                  iconName: 'car',
                },
                {
                  profile: 'motorcycle',
                  iconName: 'motorcycle',
                },
                {
                  profile: 'bicycle',
                  iconName: 'bicycle',
                },
              ].map((item) => {
                return (
                  <Button
                    icon
                    key={item.profile}
                    onClick={() => handleProfile(item.profile)}
                    color={item.profile === profile ? 'blue' : 'grey'}
                  >
                    <Icon name={item.iconName} />
                  </Button>
                )
              })}
            </Box>
            <Button
              icon
              color="red"
              onClick={() => {
                setDisplayDirection(false)
                handleRemoveWaypoints()
              }}
            >
              <Icon name="cancel" />
            </Button>
          </Box>
        </Box>
      )}
      <Box
        width={'100%'}
        display={'grid'}
        gridTemplateColumns={isDisplayDirection ? '40px auto' : 'auto'}
        gap={1}
      >
        {isDisplayDirection && (
          <>
            <Box margin={'auto'}>
              <Button
                icon
                color="blue"
                onClick={() => onReserveWaypoints(waypoints)}
              >
                <Icon name="exchange" />
              </Button>
            </Box>
          </>
        )}
        <Box>
          <SearchElement
            indexKey={0}
            showCurrentLocation={isDisplayDirection}
            setShowDirections={() => setDisplayDirection(true)}
          />
          {isDisplayDirection && (
            <>
              <Box marginTop={2}>
                <SearchElement
                  indexKey={1}
                  showCurrentLocation={true}
                  setShowDirections={() => setDisplayDirection(true)}
                />
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default MainControl
