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
  withDeviceRatio,
  withSize,
} from 'react-financial-charts';

const mapData = rawData =>
  rawData.map(item => ({
    date: new Date(item[0]),
    open: item[1],
    high: item[2],
    low: item[3],
    close: item[4],
    volume: item[5],
  }));

const StockChart = ({ data: initialData, dateTimeFormat = '%d %b' }) => {
  if (!initialData) return null;

  const ScaleProvider =
    discontinuousTimeScaleProviderBuilder().inputDateAccessor(
      d => new Date(d.date)
    );
  const height = 700;
  const width = 1500;
  const margin = { left: 0, right: 48, top: 0, bottom: 24 };

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

  const volumeChartHeight = 100;
  const volumeChartOrigin = (_, h) => [0, h - volumeChartHeight];
  const chartHeight = gridHeight - volumeChartHeight;

  const timeDisplayFormat = timeFormat(dateTimeFormat);

  const barChartExtents = data => {
    return data.volume;
  };

  const candleChartExtents = data => {
    return [data.high, data.low];
  };

  const yEdgeIndicator = data => {
    return data.close;
  };

  const volumeSeries = data => {
    return data.volume;
  };

  const openCloseColor = data => {
    return data.close > data.open ? '#26a69a' : '#ef5350';
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
      <Chart id={3} height={chartHeight} yExtents={candleChartExtents}>
        <XAxis showGridLines showTickLabel={false} />
        <YAxis showGridLines tickFormat={pricesDisplayFormat} />
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

        <ZoomButtons />
        <OHLCTooltip origin={[8, 16]} />
      </Chart>

      <Chart
        id={4}
        height={volumeChartHeight}
        yExtents={barChartExtents}
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
      <CrossHairCursor />
    </ChartCanvas>
  );
};

export default StockChart;
