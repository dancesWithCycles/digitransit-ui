import cx from 'classnames';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, intlShape } from 'react-intl';

import Icon from './Icon';
import LocalTime from './LocalTime';
import RelativeDuration from './RelativeDuration';
import RouteNumber from './RouteNumber';
import RouteNumberContainer from './RouteNumberContainer';
import { getActiveLegAlertSeverityLevel } from '../util/alertUtils';
import { displayDistance } from '../util/geo-utils';
import {
  getLegMode,
  containsBiking,
  compressLegs,
  getLegBadgeProps,
  getTotalBikingDistance,
  getTotalWalkingDistance,
  isCallAgencyPickupType,
} from '../util/legUtils';
import { sameDay, dateOrEmpty } from '../util/timeUtils';
import withBreakpoint from '../util/withBreakpoint';
import { isKeyboardSelectionEvent } from '../util/browser';
import {
  getCityBikeNetworkIcon,
  getCityBikeNetworkConfig,
} from '../util/citybikes';
import ComponentUsageExample from './ComponentUsageExample';
import {
  exampleData,
  exampleDataBiking,
  exampleDataCallAgency,
  examplePropsCityBike,
  exampleDataVia,
  exampleDataCanceled,
} from './data/SummaryRow.ExampleData';

const Leg = ({
  mode,
  routeNumber,
  legLength,
  renderNumber,
  fitRouteNumber,
}) => {
  return renderNumber ? (
    <div
      className={cx(
        'leg',
        mode.toLowerCase(),
        fitRouteNumber ? 'fit-route-number' : '',
      )}
      style={{ '--width': `${legLength}%` }}
    >
      {routeNumber}
    </div>
  ) : (
    <div className="leg">{routeNumber}</div>
  );
};

Leg.propTypes = {
  routeNumber: PropTypes.node.isRequired,
  legLength: PropTypes.number.isRequired,
  renderNumber: PropTypes.bool,
  mode: PropTypes.string,
  fitRouteNumber: PropTypes.bool,
};
Leg.defaultProps = {
  renderNumber: true,
};

export const RouteLeg = ({
  leg,
  large,
  intl,
  legLength,
  isTransitLeg,
  fitRouteNumber,
  withBicycle,
}) => {
  const isCallAgency = isCallAgencyPickupType(leg);
  let routeNumber;
  if (isCallAgency) {
    const message = intl.formatMessage({
      id: 'pay-attention',
      defaultMessage: 'Pay Attention',
    });

    routeNumber = (
      <RouteNumber
        mode="call"
        text={message}
        className={cx('line', 'call')}
        vertical
        withBar
        isTransitLeg={isTransitLeg}
      />
    );
  } else {
    routeNumber = (
      <RouteNumberContainer
        alertSeverityLevel={getActiveLegAlertSeverityLevel(leg)}
        route={leg.route}
        className={cx('line', leg.mode.toLowerCase())}
        mode={leg.mode}
        vertical
        withBar
        isTransitLeg={isTransitLeg}
        withBicycle={withBicycle}
      />
    );
  }
  return (
    <Leg
      mode={leg.mode}
      routeNumber={routeNumber}
      large={large}
      legLength={legLength}
      fitRouteNumber={fitRouteNumber}
      renderNumber
    />
  );
};

RouteLeg.propTypes = {
  leg: PropTypes.object.isRequired,
  intl: intlShape.isRequired,
  large: PropTypes.bool.isRequired,
  legLength: PropTypes.number.isRequired,
  fitRouteNumber: PropTypes.bool.isRequired,
  isTransitLeg: PropTypes.bool,
  withBicycle: PropTypes.bool.isRequired,
};

RouteLeg.defaultProps = {
  isTransitLeg: true,
};

export const ModeLeg = (
  { leg, mode, large, legLength, duration, renderNumber },
  { config },
) => {
  let networkIcon;
  if (mode === 'BICYCLE' && leg.from.bikeRentalStation) {
    networkIcon =
      leg.from.bikeRentalStation &&
      getCityBikeNetworkIcon(
        getCityBikeNetworkConfig(
          leg.from.bikeRentalStation.networks[0],
          config,
        ),
      );
  }
  const routeNumber = (
    <RouteNumber
      mode={mode}
      text=""
      className={cx('line', mode.toLowerCase())}
      duration={duration}
      renderNumber={renderNumber}
      vertical
      withBar
      icon={networkIcon}
      {...getLegBadgeProps(leg, config)}
    />
  );
  return (
    <Leg
      mode={mode}
      routeNumber={routeNumber}
      large={large}
      legLength={legLength}
    />
  );
};

ModeLeg.propTypes = {
  leg: PropTypes.object.isRequired,
  mode: PropTypes.string.isRequired,
  large: PropTypes.bool.isRequired,
  legLength: PropTypes.number.isRequired,
  duration: PropTypes.number,
  renderNumber: PropTypes.bool,
};

ModeLeg.defaultProps = {
  renderNumber: true,
};

ModeLeg.contextTypes = {
  config: PropTypes.object.isRequired,
};

export const ViaLeg = () => (
  <div className="leg via">
    <Icon img="icon-icon_mapMarker-via" className="itinerary-icon place" />
  </div>
);

const getViaPointIndex = (leg, intermediatePlaces) => {
  if (!leg || !Array.isArray(intermediatePlaces)) {
    return -1;
  }
  return intermediatePlaces.findIndex(
    place => place.lat === leg.from.lat && place.lon === leg.from.lon,
  );
};

const SummaryRow = (
  { data, breakpoint, intermediatePlaces, zones, ...props },
  { intl, intl: { formatMessage }, config },
) => {
  const isTransitLeg = leg => leg.transitLeg;
  const isLegOnFoot = leg => leg.mode === 'WALK' || leg.mode === 'BICYCLE_WALK';
  const usingOwnBicycleWholeTrip =
    data.legs.some(
      leg => getLegMode(leg) === 'BICYCLE' && leg.rentedBike === false,
    ) && data.legs.every(leg => !leg.to || !leg.to.bikePark);
  const refTime = moment(props.refTime);
  const startTime = moment(data.startTime);
  const endTime = moment(data.endTime);
  const duration = endTime.diff(startTime);

  const mobile = bp => !(bp === 'large');
  const legs = [];
  let noTransitLegs = true;
  const compressedLegs = compressLegs(data.legs).map(leg => ({
    ...leg,
  }));
  let intermediateSlack = 0;
  let transitLegCount = 0;
  compressedLegs.forEach((leg, i) => {
    if (isTransitLeg(leg)) {
      noTransitLegs = false;
      transitLegCount += 1;
    }
    if (leg.intermediatePlace) {
      intermediateSlack += leg.startTime - compressedLegs[i - 1].endTime; // calculate time spent at each intermediate place
    }
  });
  const durationWithoutSlack = duration - intermediateSlack; // don't include time spent at intermediate places in calculations for bar lengths
  let renderBarThreshold = 6;
  if (breakpoint === 'small') {
    renderBarThreshold = 8.5;
  }
  let firstLegStartTime = null;
  const vehicleNames = [];
  const stopNames = [];
  let addition = 0;
  let onlyIconLegs = 0; // keep track of legs that are too short to have a bar
  const onlyIconLegsLength = 0;
  const waitThreshold = 180000;
  const lastLeg = compressedLegs[compressedLegs.length - 1];
  const lastLegLength =
    ((lastLeg.duration * 1000) / durationWithoutSlack) * 100;
  const fitAllRouteNumbers = transitLegCount < 3;

  compressedLegs.forEach((leg, i) => {
    let renderNumber = true;
    let renderBar = true;
    let waiting = false;
    let waitTime;
    let waitLength;
    const isNextLegLast = i + 1 === compressedLegs.length - 1;
    const shouldRenderLastLeg =
      isNextLegLast && lastLegLength < renderBarThreshold;
    const previousLeg = compressedLegs[i - 1];
    const nextLeg = compressedLegs[i + 1];
    let legLength =
      ((leg.endTime - leg.startTime) / durationWithoutSlack) * 100; // length of the current leg in %
    const longName =
      leg.route && leg.route.shortName && leg.route.shortName.length > 3;

    if (nextLeg && !nextLeg.intermediatePlace) {
      // don't show waiting in intermediate places
      waitTime = nextLeg.startTime - leg.endTime;
      waitLength = (waitTime / durationWithoutSlack) * 100;
      if (waitTime > waitThreshold && waitLength > renderBarThreshold) {
        // if waittime is long enough, render a waiting bar
        waiting = true;
      } else {
        legLength =
          ((leg.endTime - leg.startTime + waitTime) / durationWithoutSlack) *
          100; // otherwise add the waiting to the current legs length
      }
    }
    legLength += addition;
    addition = 0;

    if (shouldRenderLastLeg) {
      legLength += lastLegLength; // if the last leg is too short add its length to the leg before it
    }

    if (legLength < renderBarThreshold && isLegOnFoot(leg)) {
      // don't render short legs that are on foot at all
      renderBar = false;
      addition += legLength; // carry over the length of the leg to the next
    }

    if (isTransitLeg(leg)) {
      renderNumber = true; // always try to render route number, it will get hidden in overflow if it doesn't fit
    }

    if (leg.intermediatePlace) {
      onlyIconLegs += 1;
      legs.push(<ViaLeg key={`via_${leg.mode}_${leg.startTime}`} />);
    }
    if (isLegOnFoot(leg) && renderBar) {
      const walkingTime = Math.floor(leg.duration / 60);
      legs.push(
        <ModeLeg
          key={`${leg.mode}_${leg.startTime}`}
          renderNumber
          isTransitLeg={false}
          leg={leg}
          duration={walkingTime}
          mode="WALK"
          legLength={legLength}
          large={breakpoint === 'large'}
        />,
      );
      if (leg.to.bikePark) {
        onlyIconLegs += 1;
        legs.push(
          <div
            className="leg bike_park"
            key={`${leg.mode}_${leg.startTime}_bike_park_indicator`}
          >
            <Icon
              img="icon-bike_parking"
              className="itinerary-icon bike_park"
            />
          </div>,
        );
      }
    } else if (leg.rentedBike) {
      const bikingTime = Math.floor((leg.endTime - leg.startTime) / 1000 / 60);
      legs.push(
        <ModeLeg
          key={`${leg.mode}_${leg.startTime}`}
          isTransitLeg={false}
          renderNumber
          leg={leg}
          duration={bikingTime}
          mode="CITYBIKE"
          legLength={legLength}
          large={breakpoint === 'large'}
        />,
      );
    } else if (leg.mode === 'CAR') {
      legs.push(
        <ModeLeg
          key={`${leg.mode}_${leg.startTime}`}
          leg={leg}
          mode="CAR"
          legLength={legLength}
          large={breakpoint === 'large'}
        />,
      );
    } else if (leg.mode === 'BICYCLE' && renderBar) {
      const bikingTime = Math.floor((leg.endTime - leg.startTime) / 1000 / 60);
      legs.push(
        <ModeLeg
          key={`${leg.mode}_${leg.startTime}`}
          isTransitLeg={false}
          renderNumber={renderNumber}
          duration={bikingTime}
          leg={leg}
          mode={leg.mode}
          legLength={legLength}
          large={breakpoint === 'large'}
        />,
      );
      if (leg.to.bikePark) {
        onlyIconLegs += 1;
        legs.push(
          <div
            className="leg bike_park"
            key={`${leg.mode}_${leg.startTime}_bike_park_indicator`}
          >
            <Icon
              img="icon-bike_parking"
              className="itinerary-icon bike_park"
            />
          </div>,
        );
      }
    }

    const connectsFromViaPoint = () =>
      getViaPointIndex(leg, intermediatePlaces) > -1;

    if (leg.route) {
      const withBicycle =
        usingOwnBicycleWholeTrip &&
        (leg.route.mode === 'RAIL' || leg.route.mode === 'SUBWAY');
      if (
        previousLeg &&
        !previousLeg.intermediatePlace &&
        connectsFromViaPoint()
      ) {
        legs.push(<ViaLeg key={`via_${leg.mode}_${leg.startTime}`} />);
      }
      legs.push(
        <RouteLeg
          key={`${leg.mode}_${leg.startTime}`}
          leg={leg}
          fitRouteNumber={fitAllRouteNumbers && !longName}
          intl={intl}
          legLength={legLength}
          large={breakpoint === 'large'}
          withBicycle={withBicycle}
        />,
      );
      vehicleNames.push(
        formatMessage(
          {
            id: `${leg.mode.toLowerCase()}-with-route-number`,
          },
          {
            routeNumber: leg.route.shortName,
            headSign: '',
          },
        ),
      );
      stopNames.push(leg.from.name);
    }

    if (waiting) {
      const waitingTimeinMin = Math.floor(waitTime / 1000 / 60);
      legs.push(
        <ModeLeg
          key={`${leg.mode}_${leg.startTime}_wait`}
          leg={leg}
          legLength={waitLength}
          duration={waitingTimeinMin}
          isTransitLeg={false}
          mode="WAIT"
          large={breakpoint === 'large'}
        />,
      );
    }
  });
  const normalLegs = legs.length - onlyIconLegs;
  // how many pixels to take from each 'normal' leg to give room for the icons
  const iconLegsInPixels = (24 * onlyIconLegs) / normalLegs;
  // the leftover percentage from only showing icons added to each 'normal' leg
  const iconLegsInPercents = onlyIconLegsLength / normalLegs;

  if (!noTransitLegs) {
    const firstDeparture = compressedLegs.find(isTransitLeg);
    if (firstDeparture) {
      let firstDepartureStopType;
      if (firstDeparture.mode === 'RAIL' || firstDeparture.mode === 'SUBWAY') {
        firstDepartureStopType = 'from-station';
      } else {
        firstDepartureStopType = 'from-stop';
      }
      firstLegStartTime = firstDeparture.rentedBike ? (
        <div
          className={cx('itinerary-first-leg-start-time', {
            small: breakpoint !== 'large',
          })}
        >
          <FormattedMessage
            id="itinerary-summary-row.first-leg-start-time-citybike"
            values={{
              firstDepartureTime: (
                <span className="first-leg-start-time-green">
                  <LocalTime time={firstDeparture.startTime} />
                </span>
              ),
              firstDepartureStop: firstDeparture.from.name,
            }}
          />
          <div>
            <FormattedMessage
              id="bikes-available"
              values={{
                amount: firstDeparture.from.bikeRentalStation.bikesAvailable,
              }}
            />
          </div>
        </div>
      ) : (
        <div
          className={cx('itinerary-first-leg-start-time', {
            small: breakpoint !== 'large',
          })}
        >
          <FormattedMessage
            id="itinerary-summary-row.first-leg-start-time"
            values={{
              firstDepartureTime: (
                <span className="first-leg-start-time-green">
                  <LocalTime time={firstDeparture.startTime} />
                </span>
              ),
              firstDepartureStopType: (
                <FormattedMessage id={firstDepartureStopType} />
              ),
              firstDepartureStop: stopNames[0],
            }}
          />
        </div>
      );
    }
  } else {
    firstLegStartTime = (
      <div
        className={cx('itinerary-first-leg-start-time', {
          small: breakpoint !== 'large',
        })}
      >
        <FormattedMessage id="itinerary-summary-row.no-transit-legs" />
      </div>
    );
  }

  const classes = cx([
    'itinerary-summary-row',
    'cursor-pointer',
    {
      passive: props.passive,
      'bp-large': breakpoint === 'large',
      'cancelled-itinerary': props.isCancelled,
    },
  ]);

  const itineraryStartAndEndTime = (
    <div>
      <LocalTime time={startTime} />
      <span> - </span>
      <LocalTime time={endTime} />
    </div>
  );

  //  accessible representation for summary
  const textSummary = (
    <div className="sr-only" key="screenReader">
      <FormattedMessage
        id="itinerary-summary-row.description"
        values={{
          departureDate: dateOrEmpty(startTime, refTime),
          departureTime: <LocalTime time={startTime} />,
          arrivalDate: dateOrEmpty(endTime, refTime),
          arrivalTime: <LocalTime time={endTime} />,
          firstDeparture:
            vehicleNames.length === 0 ? null : (
              <>
                <FormattedMessage
                  id="itinerary-summary-row.first-departure"
                  values={{
                    vehicle: vehicleNames[0],
                    departureTime: firstLegStartTime,
                    stopName: stopNames[0],
                  }}
                />
              </>
            ),
          transfers: vehicleNames.map((name, index) => {
            if (index === 0) {
              return null;
            }
            return formatMessage(
              { id: 'itinerary-summary-row.transfers' },
              {
                vehicle: name,
                stopName: stopNames[index],
              },
            );
          }),
          totalTime: <RelativeDuration duration={duration} />,
          distance: (
            <FormattedMessage
              id={
                containsBiking(data)
                  ? 'itinerary-summary-row.biking-distance'
                  : 'itinerary-summary-row.walking-distance'
              }
              values={{
                totalDistance: displayDistance(
                  containsBiking(data)
                    ? getTotalBikingDistance(data)
                    : getTotalWalkingDistance(data),
                  config,
                ),
              }}
            />
          ),
        }}
      />
    </div>
  );

  return (
    <span role="listitem" className={classes} aria-atomic="true">
      <h3 className="sr-only">
        <FormattedMessage
          id="summary-page.row-label"
          values={{
            number: props.hash + 1,
          }}
        />
      </h3>
      {textSummary}
      <div
        className="itinerary-summary-visible"
        style={{
          display: props.isCancelled && !props.showCancelled ? 'none' : 'flex',
        }}
      >
        {/* This next clickable region does not have proper accessible role, tabindex and keyboard handler
            because screen reader works weirdly with nested buttons. Same functonality works from the inner button */
        /* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
        <>
          <div className="itinerary-summary-header">
            <div
              className="summary-clickable-area"
              onClick={e => {
                if (mobile(breakpoint)) {
                  e.stopPropagation();
                  props.onSelectImmediately(props.hash);
                } else {
                  props.onSelect(props.hash);
                }
              }}
              onKeyPress={e =>
                isKeyboardSelectionEvent(e) && props.onSelect(props.hash)
              }
              tabIndex="0"
              role="button"
            >
              <span key="ShowOnMapScreenReader" className="sr-only">
                <FormattedMessage id="itinerary-summary-row.clickable-area-description" />
              </span>
              <div
                className="itinerary-duration-container"
                key="startTime"
                aria-hidden="true"
              >
                <span
                  className={cx('itinerary-start-date', {
                    nobg: sameDay(startTime, refTime),
                  })}
                >
                  <span>{dateOrEmpty(startTime, refTime)}</span>
                </span>
                <div className="itinerary-start-time-and-end-time">
                  {itineraryStartAndEndTime}
                </div>
                <div className="itinerary-duration">
                  <RelativeDuration duration={duration} />
                </div>
              </div>
              <div
                className="legs-container"
                style={{ '--minus': `${iconLegsInPixels}px` }}
                key="legs"
                aria-hidden="true"
              >
                <div
                  className="itinerary-legs"
                  style={{ '--plus': `${iconLegsInPercents}%` }}
                >
                  {legs}
                </div>
              </div>
              <div
                className="itinerary-first-leg-start-time-container"
                key="endtime-distance"
                aria-hidden="true"
              >
                {firstLegStartTime}
              </div>
            </div>
            {mobile(breakpoint) !== true && (
              <div
                tabIndex="0"
                role="button"
                title={formatMessage({
                  id: 'itinerary-page.show-details',
                })}
                key="arrow"
                className="action-arrow-click-area flex-vertical noborder"
                onClick={e => {
                  e.stopPropagation();
                  props.onSelectImmediately(props.hash);
                }}
                onKeyPress={e =>
                  isKeyboardSelectionEvent(e) &&
                  props.onSelectImmediately(props.hash)
                }
              >
                <div className="action-arrow flex-grow">
                  <Icon img="icon-icon_arrow-collapse--right" />
                </div>
              </div>
            )}
          </div>
          <span className="itinerary-details-container" aria-expanded="false" />
        </>
      </div>
    </span>
  );
};

SummaryRow.propTypes = {
  refTime: PropTypes.number.isRequired,
  data: PropTypes.object.isRequired,
  passive: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onSelectImmediately: PropTypes.func.isRequired,
  hash: PropTypes.number.isRequired,
  children: PropTypes.node,
  breakpoint: PropTypes.string.isRequired,
  intermediatePlaces: PropTypes.array,
  isCancelled: PropTypes.bool,
  showCancelled: PropTypes.bool,
  zones: PropTypes.arrayOf(PropTypes.string),
};

SummaryRow.defaultProps = {
  zones: [],
};

SummaryRow.contextTypes = {
  intl: intlShape.isRequired,
  config: PropTypes.object.isRequired,
};

SummaryRow.displayName = 'SummaryRow';

const nop = () => {};

SummaryRow.description = () => {
  const today = 1478522040000;
  const date = 1478611781000;
  return (
    <div>
      <p>Displays a summary of an itinerary.</p>
      <ComponentUsageExample description="large">
        {/* passive-large-today */}
        <SummaryRow
          refTime={today}
          breakpoint="large"
          data={exampleData(today)}
          passive
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
        />
        {/* active-large-today */}
        <SummaryRow
          refTime={today}
          breakpoint="large"
          data={exampleData(today)}
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
        />
        {/* "passive-large-tomorrow" */}
        <SummaryRow
          refTime={today}
          breakpoint="large"
          data={exampleData(date)}
          passive
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
        />
        {/* "active-large-tomorrow" */}
        <SummaryRow
          refTime={today}
          breakpoint="large"
          data={exampleData(date)}
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
        />
        {/* "open-large-today" */}
        <SummaryRow
          refTime={today}
          breakpoint="large"
          data={exampleData(today)}
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
        />
        {/* "open-large-tomorrow" */}
        <SummaryRow
          refTime={today}
          breakpoint="large"
          data={exampleData(date)}
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
        />
        {/* active-large-via */}
        <SummaryRow
          refTime={today}
          breakpoint="large"
          data={exampleDataVia(today)}
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
        />
        {/* active-large-call-agency */}
        <SummaryRow
          refTime={today}
          breakpoint="large"
          data={exampleDataCallAgency(today)}
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
        />
        {/* passive-large-biking */}
        <SummaryRow
          refTime={today}
          breakpoint="large"
          data={exampleDataBiking(today)}
          passive
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
        />
        {/* citybike-large-passive */}
        <SummaryRow {...examplePropsCityBike('large')} />
        {/* canceled-large-itinerary */}
        <SummaryRow
          refTime={today}
          breakpoint="large"
          data={exampleDataCanceled}
          passive
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
          isCancelled
          showCancelled
        />
      </ComponentUsageExample>
      <ComponentUsageExample description="small">
        {/* passive-small-today */}
        <SummaryRow
          refTime={today}
          breakpoint="small"
          data={exampleData(today)}
          passive
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
        />
        {/* active-small-today */}
        <SummaryRow
          refTime={today}
          breakpoint="small"
          data={exampleData(today)}
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
        />
        {/* passive-small-tomorrow */}
        <SummaryRow
          refTime={today}
          breakpoint="small"
          data={exampleData(date)}
          passive
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
        />
        {/* active-small-tomorrow */}
        <SummaryRow
          refTime={today}
          breakpoint="small"
          data={exampleData(date)}
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
        />
        {/* passive-small-via */}
        <SummaryRow
          refTime={today}
          breakpoint="small"
          data={exampleDataVia(today)}
          passive
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
        />
        {/* passive-small-call-agency */}
        <SummaryRow
          refTime={today}
          breakpoint="small"
          data={exampleDataCallAgency(today)}
          passive
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
        />
        {/* passive-small-biking */}
        <SummaryRow
          refTime={today}
          breakpoint="small"
          data={exampleDataBiking(today)}
          passive
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
        />
        {/* citybike-small-passive */}
        <SummaryRow {...examplePropsCityBike('small')} />
        {/* canceled-large-itinerary */}
        <SummaryRow
          refTime={today}
          breakpoint="small"
          data={exampleDataCanceled}
          passive
          onSelect={nop}
          onSelectImmediately={nop}
          hash={1}
          isCancelled
          showCancelled
        />
      </ComponentUsageExample>
    </div>
  );
};

const SummaryRowWithBreakpoint = withBreakpoint(SummaryRow);

export { SummaryRow as component, SummaryRowWithBreakpoint as default };
