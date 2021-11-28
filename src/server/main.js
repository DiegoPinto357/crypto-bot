const exchange = require('./exchange');
const timeframeInMilliseconds = require('./constants/timeframeInMilliseconds');

let loopInterval;

const loop = async (strategy, socket, config) => {
  // let data;

  // try {
  //   data = await exchange.getData();
  // } catch (error) {
  //   console.log(error);
  //   clearInterval(loopInterval);
  //   console.log('out of data!!!!!');
  //   console.log(exchange.getBalance());
  //   return;
  // }

  // TODO remove params from loop, since they were already passed in the setup
  await strategy.loop(exchange, socket, config);
  if (config.sim) {
    await exchange.loop();
  }
};

const run = async (strategy, socket, config) => {
  // const initialData = await exchange.setup(config);
  await exchange.setup(config);
  strategy.setup(exchange, socket, config);

  const { timeframe, loopPeriodRatio, sim, simConfig } = config;
  const { timeMultiplier } = simConfig;
  const multiplier = sim ? timeMultiplier : 1;
  const interval =
    timeframeInMilliseconds[timeframe] / (loopPeriodRatio * multiplier);

  loopInterval = setInterval(loop, interval, strategy, socket, config);
  await loop(strategy, socket, config);
};

const stop = () => clearInterval(loopInterval);

module.exports = {
  run,
  stop,
};
