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
} from 'actions/directionsActionsV2'

import {
  updateProfile,
  resetSettings,
  updatePermalink,
  zoomTo,
} from 'actions/commonActions'
import PlaceInformation from './PlaceInformation'

const pairwise = (arr, func) => {
  let cnt = 0
  for (let i = 0; i < arr.length - 1; i += 2) {
    func(arr[i], arr[i + 1], cnt)
    cnt += 1
  }
}

function MainControl() {
  const dispatch = useDispatch()

  const [isDisplayDirection, setDisplayDirection] = useState(false)

  const profile = useSelector((state) => {
    return state.common.profile
  })

  const map = useSelector((state) => {
    return state.common.map
  })
  const waypoints = useSelector((state) => {
    return state.directionsV2.waypoints || []
  })

  const handleRemoveWaypoints = () => {
    dispatch(doRemoveWaypoint())
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

  if (!map) {
    return null
  }

  return (
    <Box
      position={'absolute'}
      zIndex={999}
      top={16}
      left={16}
      padding={2}
      borderRadius={2}
      backgroundColor={'white'}
      width={300}
      // overflow={'hidden auto'}
      // height={'max-conten'}
      // maxHeight={'70vh'}
    >
      <Box>
        {isDisplayDirection && (
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
        )}
        <SearchElement
          indexKey={0}
          showCurrentLocation={true}
          showDirections={!isDisplayDirection}
          setShowDirections={() => setDisplayDirection(true)}
        />
        {isDisplayDirection && (
          <>
            <Box marginTop={2} marginBottom={2}>
              {/* <Button icon color="blue">
            <Icon style={{ transform: 'rotate(90deg)' }} name="exchange" />
          </Button> */}
            </Box>

            <SearchElement indexKey={1} showCurrentLocation={true} />
          </>
        )}
      </Box>

      {!isDisplayDirection && waypoints[0] ? (
        <PlaceInformation data={waypoints[0]} />
      ) : null}
    </Box>
  )
}

export default MainControl
