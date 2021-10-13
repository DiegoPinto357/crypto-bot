require('dotenv').config();
const exchange = require('../server/exchange');
const fs = require('fs');
const { writeFile } = fs.promises;

const config = {
  asset: 'BNB',
  base: 'USDT',
  timeframe: '1m',
  sandboxMode: true,
  sim: false,
};

const symbol = `${config.asset}/${config.base}`;
const amount = 1;
const buyPrice = 100;
const sellPrice = 100000;

const orders = [
  {
    symbol,
    type: 'market',
    side: 'sell',
    amount,
  },
  {
    symbol,
    type: 'market',
    side: 'buy',
    amount,
  },
];

(async () => {
  await exchange.setup(config);

  const initialBalance = await exchange.getBalance();

  // const markets = await exchange.loadMarkets();
  // console.log(markets[symbol].info);

  // const startTimestamp = new Date().getTime();

  const placedOrders = [];

  for (let order of orders) {
    const placedOrder = await exchange.createOrder(
      order.symbol,
      order.type,
      order.side,
      order.amount,
      order.price
    );
    placedOrders.push(placedOrder);
  }

  const finalBalance = await exchange.getBalance();

  console.log('Initial balance', initialBalance.total);
  console.log('Final balance', finalBalance.total);

  // const currentOrders = await exchange.fetchOrders(symbol, startTimestamp);

  await Promise.all([
    writeFile('./inputOrders.json', JSON.stringify(orders, null, 2)),
    writeFile('./placedOrders.json', JSON.stringify(placedOrders, null, 2)),
    // writeFile('./currentOrders.json', JSON.stringify(currentOrders, null, 2)),
  ]);
})();
