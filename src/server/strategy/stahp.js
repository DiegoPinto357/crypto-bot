const { MACD, RSI } = require('technicalindicators');
const { CustomIndicator, CandleSign } = require('./indicators');
const exchange = require('../exchange');

const minProfit = 0.06;
const stopLossMargin = 0.03;
const stopGainMargin = 0.04;

let plot;

let rsi;
let macd;
let candleSign;
let buyGate;
let buyTrigger;

let stopLossValue;
let stopGainValue;

let orders = [];

// const stopLoss = { orderId: null, value: null };
// const stopGain = { orderId: null, value: null };

let stopLossHistory;
let stopGainHistory;
let sellHistory;

const setup = (initialData, plotFunc) => {
  const openValues = initialData.map(values => values[1]);
  const closeValues = initialData.map(values => values[4]);

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

  candleSign = new CandleSign({
    open: openValues,
    close: closeValues,
  });

  buyGate = new CustomIndicator({
    initialValue: 0,
    calcFunc: (data, { rsiValue, macdHistogram, lastTrigger }) => {
      if (rsiValue <= 30 && macdHistogram < 0) return 1;
      if (lastTrigger === 1) return 0;
      return data.slice(-1)[0];
    },
  });

  buyTrigger = new CustomIndicator({
    initialValue: 0,
    calcFunc: (data, { gate, candleSign }) => {
      const lastTrigger = data.slice(-1)[0];
      return lastTrigger === 0 && gate === 1 && candleSign === 1 ? 1 : 0;
    },
  });

  stopLossHistory = new Array(closeValues.length).fill(undefined);
  stopGainHistory = new Array(closeValues.length).fill(undefined);
  sellHistory = [];

  plot = plotFunc;
  plot({ OHLCV: initialData, indicators: { rsi: rsi.getResult() } });
};

const loop = async ({ hasNewCandle, OHLCV, marketPrice, openOrders }) => {
  let sell = false;

  if (openOrders.length > 0) {
    orders = orders.filter(order => {
      const stopLossOrder = openOrders.find(
        openOrder => openOrder.id === order.stopLossOrderId
      );

      const stopGainOrder = openOrders.find(
        openOrder => openOrder.id === order.stopGainOrderId
      );

      if (!stopLossOrder || !stopGainOrder) {
        console.log('cancel orders');
        // console.log(order.stopLossOrderId);
        // console.log(order.stopGainOrderId);
        // console.log(openOrders);
        exchange.cancelOrder(order.stopLossOrderId);
        exchange.cancelOrder(order.stopGainOrderId);
        sell = true;
        return false;
      }

      return true;
    });

    const newStopGainValue = marketPrice.last * (1 - stopGainMargin);
    orders = orders.map(async order => {
      if (newStopGainValue > order.stopGainValue) {
        exchange.cancelOrder(order.stopGainOrderId);
        const id = await exchange.createOrder(
          'BTC/USDT',
          'limit',
          'sell',
          order.amount,
          {
            type: 'stopLimit',
            stopPrice: newStopGainValue,
          }
        );

        stopGainValue = newStopGainValue;
        return { ...order, stopGainOrderId: id };
      }

      return order;
    });
  }

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

  const buyGateValue = buyGate.nextValue({
    rsiValue: rsiValue,
    macdHistogram: macdValue.histogram,
    lastTrigger: buyTrigger.lastValue(),
  });

  const buyTriggerValue = buyTrigger.nextValue({
    gate: buyGateValue,
    candleSign: candleSignValue,
  });

  if (buyTriggerValue && orders.length < 1) {
    const amount = 10 / marketPrice.last;
    stopLossValue = marketPrice.last * (1 - stopLossMargin);
    stopGainValue = marketPrice.last * (1 + minProfit);

    const [marketOrderId, stopLossOrderId, stopGainOrderId] = await Promise.all(
      [
        exchange.createOrder('BTC/USDT', 'market', 'buy', amount),
        exchange.createOrder('BTC/USDT', 'limit', 'sell', amount, {
          type: 'stopLimit',
          stopPrice: stopLossValue,
        }),
        exchange.createOrder('BTC/USDT', 'limit', 'sell', amount, {
          type: 'stopLimit',
          stopPrice: stopGainValue,
        }),
      ]
    );

    orders.push({ marketOrderId, stopLossOrderId, stopGainOrderId, amount });
  }

  const rsiData = rsi.getResult();
  const macdData = macd.getResult();
  const candleSignData = candleSign.getResult();
  const buyGateData = buyGate.getResult();
  const buyTriggerData = buyTrigger.getResult();

  rsiData.push(rsiValue);
  macdData.push(macdValue);
  candleSignData.push(candleSignValue);
  buyGateData.push(buyGateValue);
  buyTriggerData.push(buyTriggerValue);
  sellHistory.push(sell);

  stopLossHistory.push(stopLossValue);
  stopGainHistory.push(stopGainValue);

  const macdHistogramData = macdData
    .map(values => values.histogram)
    .filter(value => value !== undefined);

  plot({ OHLCV: OHLCV.slice(-1), indicators: { rsi: [rsiValue] } });

  // return;

  // console.clear();
  // const stopLossLine = new Array(closeValues.length)
  //   .fill(stopLossValue)
  //   .filter(value => value !== undefined);
  // const stopGainLine = new Array(closeValues.length).fill(stopGainValue);
  // plot([stopLossLine, stopGainLine, closeValues], {
  //   height: 40,
  //   colors: [asciichart.red, asciichart.green, asciichart.default],
  // });

  // plot(buyGateData);
  // plot(buyTriggerData);
  // plot(sellHistory);

  // const line30 = new Array(rsiData.length).fill(30);
  // const line70 = new Array(rsiData.length).fill(70);
  // plot([line30, line70, rsiData], {
  //   height: 10,
  // });

  // const line0 = new Array(macdHistogramData.length).fill(0);
  // plot([line0, macdHistogramData], {
  //   height: 10,
  // });

  // const line0Vol = new Array(candleSignData.length).fill(0);
  // plot([line0Vol, candleSignData]);

  // console.log(exchange.getBalance().baseBalance);
  // console.log(exchange.getBalance().assetBalance);
  // console.log(exchange.getBalance().profit);
  // console.log(orders.length);
};

module.exports = {
  setup,
  loop,
};
