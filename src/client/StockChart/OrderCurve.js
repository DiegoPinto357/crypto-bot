import {
  LineSeries,
  ScatterSeries,
  CircleMarker,
} from 'react-financial-charts';

const getCurve =
  order =>
  ({ date }) => {
    if (!order) return null;

    const currentTimestamp = new Date(date).getTime();
    const { timestamp, lastTradeTimestamp, status, amount } = order;

    const started = currentTimestamp >= timestamp;
    const ended = currentTimestamp <= lastTradeTimestamp || status === 'open';

    return started && ended ? amount : null;
  };

const getCurveEnd =
  order =>
  ({ date }) => {
    if (!order) return null;

    const { timestamp, status, price } = order;
    // if (status === "open") return null;

    const currentTimestamp = new Date(date).getTime();
    const nextTimestamp = currentTimestamp + 60 * 1000;

    // console.log({ currentTimestamp, nextTimestamp, timestamp });
    // console.log(timestamp >= currentTimestamp, timestamp <= nextTimestamp);

    return timestamp >= currentTimestamp && timestamp <= nextTimestamp
      ? price
      : null;
  };

const getColor = ({ side }) => (side === 'buy' ? '#2196f3' : '#F38121');

const OrderCurve = props => {
  const { order, ...rest } = props;

  const color = order.side === 'buy' ? '#2196f3' : '#F38121';

  return (
    <>
      {/* <LineSeries
        yAccessor={getCurve(order)}
        strokeStyle={getColor(order)}
        strokeWidth={2}
        {...rest}
      /> */}

      <ScatterSeries
        yAccessor={getCurveEnd(order)}
        marker={CircleMarker}
        markerProps={{
          r: 3,
          strokeStyle: '#FFF',
          fillStyle: color,
        }}
      />

      {/* <Annotate
        with={SvgPathAnnotation}
        usingProps={svgAnnotation}
        when={when(order)}
      />

      <SvgPathAnnotation
        xAccessor={() => order.lastTradeTimestamp}
        xScale={() => 1}
        path={svgAnnotation.path}
        pathHeight={16}
        pathWidth={16}
        // x={500}
        y={500}
        datum={[41100]}
      /> */}
    </>
  );
};

export default OrderCurve;
