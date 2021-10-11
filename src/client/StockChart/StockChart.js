import React from 'react';
import { format } from 'd3-format';
import { timeFormat } from 'd3-time-format';
import {
  ema,
  discontinuousTimeScaleProviderBuilder,
  Chart,
  ChartCanvas,
  CurrentCoordinate,
  BarSeries,
  CandlestickSeries,
  LineSeries,
  MovingAverageTooltip,
  OHLCTooltip,
  SingleValueTooltip,
  lastVisibleItemBasedZoomAnchor,
  XAxis,
  YAxis,
  CrossHairCursor,
  EdgeIndicator,
  MouseCoordinateX,
  MouseCoordinateY,
  ZoomButtons,
  RSISeries,
  RSITooltip,
  MACDSeries,
  MACDTooltip,
  withDeviceRatio,
  withSize,
} from 'react-financial-charts';

const mapData = ({ OHLCV, indicators }) =>
  OHLCV.map((item, index) => ({
    date: new Date(item[0]),
    open: item[1],
    high: item[2],
    low: item[3],
    close: item[4],
    volume: item[5],
    indicators: {
      rsi: indicators.rsi[index],
      macd: indicators.macd[index],
    },
  }));

const candleChartExtents = data => [data.high, data.low];

const yEdgeIndicator = data => data.close;

const volumeSeries = data => data.volume;
const volumeChartExtents = data => data.volume;

const rsiSeries = data => data.indicators.rsi;

const macdSeries = data => data.indicators.macd;
const macdChartExtents = data => {
  if (!data.indicators.macd) return;
  const { macd, divergence, signal } = data.indicators.macd;
  return [
    Math.min(macd, divergence, signal),
    Math.max(macd, divergence, signal),
  ];
};

const openCloseColor = data => (data.close > data.open ? '#26a69a' : '#ef5350');

const positiveNegativeColor = data =>
  data.indicators.macd.divergence >= 0 ? '#26a69a' : '#ef5350';

const StockChart = ({
  data: initialData = { OHLCV: [], indicators: [] },
  dateTimeFormat = '%d %b',
  width,
  height,
}) => {
  const ScaleProvider =
    discontinuousTimeScaleProviderBuilder().inputDateAccessor(
      d => new Date(d.date)
    );
  const margin = { left: 0, right: 96, top: 0, bottom: 32 };

  const ema12 = ema()
    .id(1)
    .options({ windowSize: 12 })
    .merge((d, c) => {
      d.ema12 = c;
    })
    .accessor(d => d.ema12);

  const ema26 = ema()
    .id(2)
    .options({ windowSize: 26 })
    .merge((d, c) => {
      d.ema26 = c;
    })
    .accessor(d => d.ema26);

  const calculatedData = ema26(ema12(mapData(initialData)));

  const { data, xScale, xAccessor, displayXAccessor } =
    ScaleProvider(calculatedData);
  const pricesDisplayFormat = format('.2f');
  const max = xAccessor(data[data.length - 1]);
  const min = xAccessor(data[Math.max(0, data.length - 100)]);
  const xExtents = [min, max + 5];

  const gridHeight = height - margin.top - margin.bottom;
  const secondaryChartHeight = 100;
  const chartGutter = 32;
  const numOfSecondaryCharts = 3;

  const mainChartHeight =
    gridHeight - numOfSecondaryCharts * (secondaryChartHeight + chartGutter);

  const volumeChartOrigin = (_, h) => [0, mainChartHeight];

  const rsiChartOrigin = (_, h) => [
    0,
    mainChartHeight + secondaryChartHeight + chartGutter,
  ];

  const macdChartOrigin = (_, h) => [
    0,
    mainChartHeight + 2 * secondaryChartHeight + chartGutter,
  ];

  const timeDisplayFormat = timeFormat(dateTimeFormat);

  const macdAppearance = {
    fillStyle: { divergence: positiveNegativeColor },
    strokeStyle: {
      macd: '#0093FF',
      signal: '#D84315',
      zero: 'rgba(0, 0, 0, 0.3)',
    },
  };

  return (
    <ChartCanvas
      height={height}
      ratio={3}
      width={width}
      margin={margin}
      data={data}
      displayXAccessor={displayXAccessor}
      seriesName="Data"
      xScale={xScale}
      xAccessor={xAccessor}
      xExtents={xExtents}
      zoomAnchor={lastVisibleItemBasedZoomAnchor}
    >
      <Chart id={1} height={mainChartHeight} yExtents={candleChartExtents}>
        <XAxis showGridLines showTickLabel={false} />
        <YAxis
          showGridLines
          tickFormat={pricesDisplayFormat}
          yZoomWidth={200}
        />
        <CandlestickSeries />
        <LineSeries yAccessor={ema26.accessor()} strokeStyle={ema26.stroke()} />
        <CurrentCoordinate
          yAccessor={ema26.accessor()}
          fillStyle={ema26.stroke()}
        />
        <LineSeries yAccessor={ema12.accessor()} strokeStyle={ema12.stroke()} />
        <CurrentCoordinate
          yAccessor={ema12.accessor()}
          fillStyle={ema12.stroke()}
        />
        <MouseCoordinateY
          rectWidth={margin.right}
          displayFormat={pricesDisplayFormat}
        />
        <EdgeIndicator
          itemType="last"
          rectWidth={margin.right}
          fill={openCloseColor}
          lineStroke={openCloseColor}
          displayFormat={pricesDisplayFormat}
          yAccessor={yEdgeIndicator}
        />
        <MovingAverageTooltip
          origin={[8, 24]}
          options={[
            {
              yAccessor: ema26.accessor(),
              type: 'EMA',
              stroke: ema26.stroke(),
              windowSize: ema26.options().windowSize,
            },
            {
              yAccessor: ema12.accessor(),
              type: 'EMA',
              stroke: ema12.stroke(),
              windowSize: ema12.options().windowSize,
            },
          ]}
        />

        {/* <ZoomButtons /> */}
        <OHLCTooltip origin={[8, 16]} />
      </Chart>

      <Chart
        id={2}
        height={secondaryChartHeight}
        yExtents={volumeChartExtents}
        origin={volumeChartOrigin}
        padding={{ top: 8, bottom: 8 }}
      >
        <XAxis showGridLines gridLinesStrokeStyle="#e0e3eb" />
        <YAxis ticks={4} tickFormat={pricesDisplayFormat} />

        <MouseCoordinateX displayFormat={timeDisplayFormat} />
        <MouseCoordinateY
          rectWidth={margin.right}
          displayFormat={pricesDisplayFormat}
        />

        <BarSeries fillStyle={openCloseColor} yAccessor={volumeSeries} />

        <SingleValueTooltip
          yAccessor={volumeSeries}
          yLabel="Volume"
          origin={[8, 16]}
        />
      </Chart>

      <Chart
        id={3}
        yExtents={[0, 100]}
        origin={rsiChartOrigin}
        height={secondaryChartHeight}
      >
        {/* <XAxis /> */}
        <YAxis tickValues={[30, 50, 70]} />

        <RSISeries yAccessor={rsiSeries} />

        <RSITooltip
          origin={[8, 16]}
          yAccessor={rsiSeries}
          options={{ windowSize: 10 }} // TODO get options dynamically
        />
      </Chart>

      <Chart
        id={4}
        yExtents={macdChartExtents}
        origin={macdChartOrigin}
        height={secondaryChartHeight}
      >
        <XAxis />
        <YAxis ticks={4} />

        <MACDSeries
          yAccessor={macdSeries}
          widthRatio={0.8}
          {...macdAppearance}
        />

        <MACDTooltip
          origin={[8, 16]}
          yAccessor={macdSeries}
          appearance={macdAppearance}
          options={{ fast: 12, signal: 9, slow: 26 }} // TODO get options dynamically
        />
      </Chart>

      <CrossHairCursor />
    </ChartCanvas>
  );
};

export default withSize({ style: { minHeight: 800 } })(
  withDeviceRatio()(StockChart)
);
