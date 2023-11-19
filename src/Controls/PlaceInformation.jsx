import React from 'react'
import PropTypes from 'prop-types'
import { Item, Card, Icon, Image, Button } from 'semantic-ui-react'

function PlaceInformation({ data }) {
  const { raw, label, results = [] } = data || {}
  if (!data || !label || !raw) {
    return null
  }
  const { geometry, properties } = raw

  return (
    <Card>
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
          <Button icon color="blue">
            <Icon
              style={{ transform: 'rotate(-90deg)' }}
              name="level down alternate"
            />
          </Button>
          <Button icon color="blue">
            <Icon name="copy" />
          </Button>
          <Button icon color="blue">
            <Icon name="map marker alternate" />
          </Button>
          <Button icon color="blue">
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

            return (
              <Item key={item.label}>
                <Item.Image
                  size="tiny"
                  src="https://storage.googleapis.com/support-forums-api/attachment/message-159468019-14123974350713629170.png"
                />
                <Item.Content>
                  <Item.Header as="a">{item.raw.properties.name}</Item.Header>
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
}
export default PlaceInformation
