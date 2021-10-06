require('dotenv').config();
const main = require('./main');

const config = {
  asset: 'BTC',
  base: 'USDT',
  timeframe: '1h',
  loopPeriodRatio: 12,
  sandboxMode: true,
  sim: true,
  simConfig: {
    dataFile: 'aggregated-1631678400000-1633482000000.json',
    transientLength: 100,
    timeMultiplier: 200 * 60,
  },
};

main.run(config);
