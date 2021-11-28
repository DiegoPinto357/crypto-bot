const timeframeInMilliseconds = require('../constants/timeframeInMilliseconds');

let client;
let market;
let timeframe;
let historyData;

const getOHLCV = async n => {
  const now = await client.fetchTime();
  const since = now - n * timeframeInMilliseconds[timeframe];
  return await client.fetchOHLCV(market, timeframe, since);
};

const setup = async (paramClient, config) => {
  const { asset, base, timeframe: configTimeframe } = config;
  client = paramClient;
  timeframe = configTimeframe;
  market = `${asset}/${base}`;

  historyData = await getOHLCV(100); //40
  return historyData;
};

const loop = () => client.loop();

const getData = async () => {
  const [OHLCV, marketPrice, openOrders] = await Promise.all([
    getOHLCV(1),
    client.fetchTicker(market),
    client.fetchOpenOrders(),
  ]);

  const lastHistoryTimestamp = historyData.slice(-1)[0][0];
  const lastServerTimestamp = OHLCV[0][0]; // FIXME Cannot read property '0' of undefined

  let hasNewCandle = false;
  if (lastServerTimestamp > lastHistoryTimestamp) {
    historyData.push(OHLCV[0]);
    hasNewCandle = true;
  }

  return {
    hasNewCandle,
    OHLCV: historyData,
    marketPrice,
    openOrders,
  };
};

const createOrder = (symbol, type, side, amount, price) => {
  return client.createOrder(symbol, type, side, amount, price);
};
const cancelOrder = (...args) => client.cancelOrder(...args);

const fetchBalance = () => client.fetchBalance();

const fetchTickers = (...args) => client.fetchTickers(...args);

const loadMarkets = () => client.loadMarkets();

const fetchOrders = (...args) => client.fetchOrders(...args);

module.exports = {
  setup,
  loop,
  getData,
  createOrder,
  cancelOrder,
  fetchBalance,
  fetchTickers,

  loadMarkets,
  fetchOrders,
};
