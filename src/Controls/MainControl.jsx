import React from 'react'
import { useSelector } from 'react-redux'
import SearchElement from './SearchElement'
import { Icon, Button } from 'semantic-ui-react'
import { useDispatch } from 'react-redux'
import { zoomTo } from 'actions/commonActions'
import { Box } from '@mui/material'

function MainControl() {
  const dispatch = useDispatch()
  const map = useSelector((state) => {
    return state.common.map
  })
  const waypoints = useSelector((state) => {
    return state.directionsV2.waypoints
  })

  React.useEffect(() => {
    if (waypoints.length >= 2) {
      const coordinates = waypoints.map(
        (waypoint) => waypoint.raw.geometry.coordinates
      )
      dispatch(zoomTo(coordinates))
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
    >
      <Box>
        <Box display={'flex'} marginBottom={2} justifyContent={'space-between'}>
          <Box
            display={'grid'}
            grid={'40px 40px 40px'}
            gridGap={1}
            gridTemplateColumns={'auto auto auto'}
          >
            <Button icon color="blue">
              <Icon color="white" name="car" />
            </Button>
            <Button icon color="blue">
              <Icon color="white" name="motorcycle" />
            </Button>
            <Button icon color="blue">
              <Icon color="white" name="taxi" />
            </Button>
          </Box>
          <Button icon color="red">
            <Icon color="white" name="cancel" />
          </Button>
        </Box>
        <SearchElement indexKey={0} showCurrentLocation={true} />
        <Box marginTop={2} marginBottom={2}>
          <Button icon color="blue">
            <Icon color="white" name="resize horizontal" />
          </Button>
        </Box>

        <SearchElement indexKey={1} showCurrentLocation={true} />
      </Box>
    </Box>
  )
}

export default MainControl
