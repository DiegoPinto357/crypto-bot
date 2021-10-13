const exchange = require('./exchange');
const strategy = require('./strategy/stahp');
const timeframeInMilliseconds = require('./constants/timeframeInMilliseconds');

let loopInterval;

const loop = async sim => {
  let data;

  try {
    data = await exchange.getData();
  } catch {
    clearInterval(loopInterval);
    console.log('out of data!!!!!');
    console.log(exchange.getBalance());
    return;
  }

  await strategy.loop(data);
  if (sim) {
    await exchange.loop();
  }
};

const run = async (config, socket) => {
  const initialData = await exchange.setup(config);
  strategy.setup(initialData, socket);

  const { timeframe, loopPeriodRatio, sim, simConfig } = config;
  const { timeMultiplier } = simConfig;
  const multiplier = sim ? timeMultiplier : 1;
  const interval =
    timeframeInMilliseconds[timeframe] / (loopPeriodRatio * multiplier);

  loopInterval = setInterval(loop, interval, sim);
  // loop(sim);
};

module.exports = {
  run,
};
