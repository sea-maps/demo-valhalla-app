import React from 'react'
import PropTypes from 'prop-types'
import { Item, Card, Icon, Image, Button } from 'semantic-ui-react'
import { toast } from 'react-toastify'

function PlaceInformation({
  data,
  setShowDirections,
  pointingToCurrentPosition,
}) {
  const { raw, label, results = [] } = data || {}
  if (!data || !label || !raw) {
    return null
  }
  const { geometry, properties } = raw

  const copyToClipboard = () => {
    toast.success('Save the link', {
      position: 'top-center',
      autoClose: 600,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'light',
    })
    navigator.clipboard.writeText(window.location.href)
  }

  const onSave = () => {
    toast.success('Press ctrl/cmd + D to save bookmark', {
      position: 'top-center',
      autoClose: 600,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'light',
    })
  }
  return (
    <Card style={{ width: '100%' }}>
      <Image
        src="https://storage.googleapis.com/support-forums-api/attachment/message-159468019-14123974350713629170.png"
        wrapped
        ui={false}
      />
      <Card.Content>
        {properties && properties.name ? (
          <Card.Header>{properties.name}</Card.Header>
        ) : null}
        <Card.Meta>
          <span>{label}</span>
        </Card.Meta>
        <Card.Description>
          {geometry.type}: {JSON.stringify(geometry.coordinates)}
        </Card.Description>
      </Card.Content>

      <Card.Content extra>
        <div
          style={{
            display: 'grid',
            gridGap: 1,
            gridTemplateColumns: 'auto auto auto auto',
          }}
        >
          <Button icon color="blue" onClick={setShowDirections}>
            <Icon
              style={{ transform: 'rotate(-90deg)' }}
              name="level down alternate"
            />
          </Button>
          <Button icon color="blue" onClick={onSave}>
            <Icon name="copy" />
          </Button>
          <Button icon color="blue" onClick={pointingToCurrentPosition}>
            <Icon name="map marker alternate" />
          </Button>
          <Button icon color="blue" onClick={copyToClipboard}>
            <Icon name="share" />
          </Button>
        </div>
      </Card.Content>

      <Card.Content extra>
        <Card.Description>Relative locations</Card.Description>

        <Item.Group>
          {results.map((item) => {
            if (!item || !item.raw || !item.raw.properties) {
              return null
            }

            const { coordinates = [] } = item.raw.geometry || {}
            const search = decodeURIComponent(window.location.search)
            const queryParams = new URLSearchParams(search)

            queryParams.set('wps', `${coordinates.join(',')}`)

            const href = window.location.pathname + '?' + queryParams.toString()

            return (
              <Item key={item.label}>
                <Item.Image
                  size="tiny"
                  src="https://storage.googleapis.com/support-forums-api/attachment/message-159468019-14123974350713629170.png"
                />
                <Item.Content>
                  <Item.Header as="a" href={href} target={'_blank'}>
                    {item.raw.properties.name}
                  </Item.Header>
                  <Item.Meta>{item.label}</Item.Meta>
                  <Item.Description></Item.Description>
                </Item.Content>
              </Item>
            )
          })}
        </Item.Group>
      </Card.Content>
    </Card>
  )
}

PlaceInformation.propTypes = {
  data: PropTypes.bool,
  setShowDirections: PropTypes.func,
  pointingToCurrentPosition: PropTypes.func,
}
export default PlaceInformation
