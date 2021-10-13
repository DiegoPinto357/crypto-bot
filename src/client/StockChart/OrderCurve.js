import {
  LineSeries,
  ScatterSeries,
  CircleMarker,
  Annotate,
  SvgPathAnnotation,
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

    const { lastTradeTimestamp, status, amount } = order;
    if (status === 'open') return null;

    const currentTimestamp = new Date(date).getTime();

    return currentTimestamp === lastTradeTimestamp ? amount : null;
  };

const getColor = ({ side }) => (side === 'buy' ? '#2196f3' : '#F38121');

const when =
  order =>
  ({ date }) => {
    const { lastTradeTimestamp, status } = order;
    if (status === 'open') return false;

    const currentTimestamp = new Date(date).getTime();
    console.log({ currentTimestamp, lastTradeTimestamp });
    return currentTimestamp === lastTradeTimestamp;
  };

const OrderCurve = props => {
  const { order, ...rest } = props;

  return (
    <>
      <LineSeries
        yAccessor={getCurve(order)}
        strokeStyle={getColor(order)}
        strokeWidth={2}
        {...rest}
      />

      <ScatterSeries
        yAccessor={getCurveEnd(order)}
        marker={CircleMarker}
        markerProps={{ r: 5 }}
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
