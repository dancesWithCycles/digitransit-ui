import React from 'react';
import sinon from 'sinon';

import { shallowWithIntl } from '../../helpers/mock-intl-enzyme';
import { Component as MapWithTracking } from '../../../../app/component/map/MapWithTracking';

const defaultProps = {
  getGeoJsonConfig: () => {},
  getGeoJsonData: () => {},
  origin: {},
  position: {
    hasLocation: false,
    isLocationingInProgress: false,
    lat: 60,
    lon: 25,
  },
  config: {
    defaultEndpoint: {},
  },
  mapLayers: {
    geoJson: {},
    stop: {},
    terminal: {},
    ticketSales: {},
  },
};

describe('<MapWithTracking />', () => {
  it('should render', () => {
    const wrapper = shallowWithIntl(<MapWithTracking {...defaultProps} />);
    expect(wrapper.isEmptyRender()).to.equal(false);
  });

  it('should use the configured geojson layers', async () => {
    const layerUrl = 'testLayerUrl';

    const props = {
      ...defaultProps,
      getGeoJsonConfig: sinon.stub(),
      getGeoJsonData: url =>
        url === layerUrl && {
          type: 'FeatureCollection',
          features: [],
        },
      config: {
        ...defaultProps.config,
        geoJson: {
          layers: [
            {
              name: {
                fi: 'Testi',
                en: 'Test',
              },
              url: layerUrl,
            },
          ],
        },
      },
    };

    const wrapper = shallowWithIntl(<MapWithTracking {...props} />);
    await wrapper.instance().componentDidMount();

    expect(props.getGeoJsonConfig.called).to.equal(false);
    expect(wrapper.state().geoJson).to.deep.equal({
      [layerUrl]: {
        type: 'FeatureCollection',
        features: [],
      },
    });
  });

  it('should retrieve an external geojson layer configuration', async () => {
    const layerConfigUrl = 'testLayerConfigUrl';
    const layerUrl = 'testLayerUrl';

    const props = {
      ...defaultProps,
      getGeoJsonConfig: url =>
        url === layerConfigUrl && [
          {
            name: {
              fi: 'Testi',
              en: 'Test',
            },
            url: layerUrl,
          },
        ],
      getGeoJsonData: url =>
        url === layerUrl && {
          type: 'FeatureCollection',
          features: [],
        },
      config: {
        ...defaultProps.config,
        geoJson: {
          layerConfigUrl,
        },
      },
    };

    const wrapper = shallowWithIntl(<MapWithTracking {...props} />);
    await wrapper.instance().componentDidMount();

    expect(wrapper.state().geoJson).to.deep.equal({
      [layerUrl]: {
        type: 'FeatureCollection',
        features: [],
      },
    });
  });
});
