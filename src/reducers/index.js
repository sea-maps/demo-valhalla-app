import { combineReducers } from 'redux'
import { common } from './common'
import { directions as directionsV2 } from './directionsV2'
import { directions } from './directions'
import { isochrones } from './isochrones'

const rootReducer = combineReducers({
  common,
  directions,
  directionsV2,
  isochrones,
})

export default rootReducer
