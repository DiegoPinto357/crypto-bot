const path = require('path');
const { readFile, appendFile } = require('fs').promises;
const timeframeInMilliseconds = require('../constants/timeframeInMilliseconds');

const feeRate = 0.001;

module.exports = async config => {
  const { asset, base, timeframe, simConfig } = config;
  const { dataFile, transientLength, timeMultiplier = 1 } = simConfig;

  const dataFilename = path.join(
    'src/server/cryptoData',
    `${asset}-${base}`,
    `${timeframe}`,
    dataFile
  );

  const data = JSON.parse(await readFile(dataFilename, 'utf8'));

  let dataIndex = 0;
  const initialTime =
    data[0][0] + transientLength * timeframeInMilliseconds[timeframe];
  let timeOffset = new Date().getTime() - initialTime;

  const orderLogFilename = path.join(
    'src/server/logs/orders',
    `${asset}-${base}`,
    'test.log'
  );

  const orders = [];
  let orderId = 0;

  const updateTimer = async () => {
    const serverTime = await fetchTime();
    dataIndex = data.findIndex(item => item[0] > serverTime);
    return serverTime;
  };

  const fetchTime = async () => {
    const now = new Date().getTime();
    const simNow = now - timeOffset;
    const delta = simNow - initialTime;
    return initialTime + delta * timeMultiplier;
  };

  const fetchOHLCV = async (market, timeframe, since) => {
    const serverTime = await updateTimer();

    const timeframeMs = timeframeInMilliseconds[timeframe];
    const n = Math.round((serverTime - since) / timeframeMs);

    const startIndex = dataIndex - n;
    const endIndex = dataIndex - 1;
    return data.slice(startIndex, endIndex + 1);
  };

  const fetchTicker = async () => {
    const serverTime = await updateTimer();

    const high = data[dataIndex][2];
    const low = data[dataIndex][3];
    const value = Math.random() * (high - low) + low;

    return {
      timestamp: serverTime,
      last: value,
    };
  };

  const fetchOpenOrders = () => Promise.resolve(orders);

  const createOrder = async (symbol, type, side, amount, params) => {
    // console.log('Order created');
    // console.log({ symbol, type, side, amount, params });

    const id = orderId++;
    const status = 'open';
    const info = {
      processStatus: params?.type === 'stopLimit' ? 'idle' : 'active',
    };
    orders.push({ id, status, symbol, type, side, amount, params, info });
    // console.log('orders', orders);

    if (type === 'market') {
      const { last: price } = await fetchTicker();
      executeOrder(id, price);
    }

    return id;
  };

  const cancelOrder = id => {
    // console.log('cancel order', { id });
    const orderIndex = orders.map(order => order.id).indexOf(id);
    if (orderIndex === -1) return;
    orders.splice(orderIndex, 1);
  };

  const executeOrder = async (id, price) => {
    const orderIndex = orders
      .filter(order => order.status !== 'closed' && order.status !== 'canceled')
      .map(order => order.id)
      .indexOf(id);
    const order = orders[orderIndex];
    if (!order) return;
    orders.splice(orderIndex, 1);

    const { side, amount } = order;
    const fee = amount * feeRate;

    feesPayed += fee; // TODO connsider fees in other currencies
    assetBalance =
      side === 'buy'
        ? assetBalance + amount - fee
        : assetBalance - amount - fee;
    baseBalance =
      side === 'buy'
        ? baseBalance - amount * price
        : baseBalance + amount * price;

    // order.status = 'closed';

    // console.log('Order executed');
    // console.log({ id, type: order.type, side, amount, price, fee });
    // console.log('orders', orders);
  };

  const initialBaseBalance = 100;
  const price = await fetchTicker();
  const initialAssetBalance = 0 / price.last;

  let baseBalance = initialBaseBalance;
  let assetBalance = initialAssetBalance;
  let feesPayed = 0;

  const getBalance = () => {
    const index = dataIndex < data.length ? dataIndex : data.length - 1;
    const price = data[index][4];
    const profitBase = baseBalance - initialBaseBalance;
    const profitAsset = assetBalance - initialAssetBalance;
    const profit = profitBase + profitAsset * price;
    const feesPayedinBase = feesPayed * price;

    return {
      initialBaseBalance,
      baseBalance,
      initialAssetBalance,
      assetBalance,
      feesPayed,
      feesPayedinBase,
      profitBase,
      profitAsset,
      profit,
    };
  };

  const loop = async () => {
    const { last: price } = await fetchTicker();

    orders.forEach(order => {
      const { id, side, info, params } = order;
      if (side === 'sell') {
        if (info.processStatus === 'idle' && price >= params.stopPrice) {
          order.info.processStatus = 'active';
          return;
        }

        if (info.processStatus === 'active' && price <= params.stopPrice) {
          executeOrder(id, price);
          return;
        }
      }
    });

    // if (orders.length) console.log('orders', orders);
  };

  return {
    fetchTime,
    fetchOHLCV,
    fetchTicker,
    fetchOpenOrders,
    createOrder,
    cancelOrder,
    getBalance,
    loop,
  };
};
