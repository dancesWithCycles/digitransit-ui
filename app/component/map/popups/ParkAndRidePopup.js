import React from 'react';
import MarkerPopupBottom from '../marker-popup-bottom';

import Card from '../../card/card';
import CardHeader from '../../card/CardHeader';
import ComponentUsageExample from '../../documentation/ComponentUsageExample';

export default class ParkAndRidePopup extends React.Component {
  static contextTypes = {
    getStore: React.PropTypes.func.isRequired,
  };

  static description = (
    <div>
      <p>Renders a citybike popup.</p>
      <ComponentUsageExample description="">
        <ParkAndRidePopup context="context object here">
          Im content of a citybike card
        </ParkAndRidePopup>
      </ComponentUsageExample>
    </div>
  );

  static propTypes = {
    realtime: React.PropTypes.bool.isRequired,
    maxCapacity: React.PropTypes.number.isRequired,
    spacesAvailable: React.PropTypes.number.isRequired,
    context: React.PropTypes.object.isRequired,
    name: React.PropTypes.string.isRequired,
    lat: React.PropTypes.number.isRequired,
    lon: React.PropTypes.number.isRequired,
  };

  render() {
    return (
      <div className="card">
        <Card className="padding-small">
          <CardHeader
            name="Liityntäpysäköinti"
            description={this.props.name}
            icon="icon-icon_car"
          />
          <div />
        </Card>
        <MarkerPopupBottom
          location={{
            address: this.props.name,
            lat: this.props.lat,
            lon: this.props.lon,
          }}
        />
      </div>
    );
  }
}
