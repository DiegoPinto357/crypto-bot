const { MACD, RSI } = require('technicalindicators');
const { CustomIndicator, CandleSign } = require('./indicators');
const { plot } = require('../libs/terminalPlot');
const exchange = require('../exchange');

let candleSign;
let rsi;
let macd;
let sellGate;
let buyGate;
let sellTrigger;
let buyTrigger;

const setup = initialData => {
  const openValues = initialData.map(values => values[1]);
  const closeValues = initialData.map(values => values[4]);

  candleSign = new CandleSign({
    open: openValues,
    close: closeValues,
  });

  rsi = new RSI({
    values: closeValues,
    period: 10,
  });

  macd = new MACD({
    values: closeValues,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  sellGate = new CustomIndicator({
    initialValue: 0,
    calcFunc: (data, { rsiValue, macdHistogram, lastTrigger }) => {
      if (rsiValue >= 70 && macdHistogram > 0) return 1;
      if (lastTrigger === 1) return 0;
      return data.slice(-1)[0];
    },
  });

  buyGate = new CustomIndicator({
    initialValue: 0,
    calcFunc: (data, { rsiValue, macdHistogram, lastTrigger }) => {
      if (rsiValue <= 30 && macdHistogram < 0) return 1;
      if (lastTrigger === 1) return 0;
      return data.slice(-1)[0];
    },
  });

  sellTrigger = new CustomIndicator({
    initialValue: 0,
    calcFunc: (data, { gate, candleSign }) => {
      const lastValue = data.slice(-1)[0];
      return lastValue === 0 && gate === 1 && candleSign === -1 ? 1 : 0;
    },
  });

  buyTrigger = new CustomIndicator({
    initialValue: 0,
    calcFunc: (data, { gate, candleSign }) => {
      const lastValue = data.slice(-1)[0];
      return lastValue === 0 && gate === 1 && candleSign === 1 ? 1 : 0;
    },
  });
};

const loop = ({ hasNewCandle, OHLCV, marketPrice }) => {
  if (!hasNewCandle) return;

  const closeValues = OHLCV.map(values => values[4]);

  const closeValue = closeValues.slice(-1)[0];
  const openValue = OHLCV.slice(-1)[0][1];

  const rsiValue = rsi.nextValue(closeValue);
  const macdValue = macd.nextValue(closeValue);

  const candleSignValue = candleSign.nextValue({
    open: openValue,
    close: closeValue,
  });

  const sellGateValue = sellGate.nextValue({
    rsiValue: rsiValue,
    macdHistogram: macdValue.histogram,
    lastTrigger: sellTrigger.lastValue(),
  });

  const buyGateValue = buyGate.nextValue({
    rsiValue: rsiValue,
    macdHistogram: macdValue.histogram,
    lastTrigger: buyTrigger.lastValue(),
  });

  const sellTriggerValue = sellTrigger.nextValue({
    gate: sellGateValue,
    candleSign: candleSignValue,
  });

  const buyTriggerValue = buyTrigger.nextValue({
    gate: buyGateValue,
    candleSign: candleSignValue,
  });

  if (sellTriggerValue) {
    const amount = 10 / marketPrice.last;
    exchange.createOrder('BTC/USDT', 'sell', amount);
  }

  if (buyTriggerValue) {
    const amount = 10 / marketPrice.last;
    exchange.createOrder('BTC/USDT', 'buy', amount);
  }

  const candleSignData = candleSign.getResult();
  const rsiData = rsi.getResult();
  const macdData = macd.getResult();
  const sellGateData = sellGate.getResult();
  const buyGateData = buyGate.getResult();
  const sellTriggerData = sellTrigger.getResult();
  const buyTriggerData = buyTrigger.getResult();

  candleSignData.push(candleSignValue);
  rsiData.push(rsiValue);
  macdData.push(macdValue);
  sellGateData.push(sellGateValue);
  buyGateData.push(buyGateValue);
  sellTriggerData.push(sellTriggerValue);
  buyTriggerData.push(buyTriggerValue);

  const macdHistogramData = macdData
    .map(values => values.histogram)
    .filter(value => value !== undefined);

  console.clear();
  plot(closeValues, { height: 20 });

  plot(sellGateData);
  plot(sellTriggerData);
  plot(buyGateData);
  plot(buyTriggerData);

  const line30 = new Array(rsiData.length).fill(30);
  const line70 = new Array(rsiData.length).fill(70);
  plot([line30, line70, rsiData], {
    height: 10,
  });

  const line0 = new Array(macdHistogramData.length).fill(0);
  plot([line0, macdHistogramData], {
    height: 10,
  });

  const line0Vol = new Array(candleSignData.length).fill(0);
  plot([line0Vol, candleSignData]);

  console.log(exchange.getBalance().profitBase);
  console.log(exchange.getBalance().profitAsset);
  console.log(exchange.getBalance().profit);
};

module.exports = {
  setup,
  loop,
};
