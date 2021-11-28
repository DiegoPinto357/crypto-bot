const main = require('./main');
const exchange = require('./exchange');

jest.mock('./exchange');

const strategy = { setup: jest.fn(), loop: jest.fn() };

const defaultConfig = {
  timeframe: '1m',
  loopPeriodRatio: 4,
  sim: false,
  simConfig: { timeMultiplier: 10 * 60 },
  strategy: {
    assets: ['BTC', 'ETH', 'ADA', 'BUSD'],
  },
};

const socket = {};

describe('main', () => {
  it('calls setup function for both exchange and strategy when run', async () => {
    await main.run(strategy, socket, defaultConfig);

    expect(exchange.setup).toBeCalledTimes(1);
    expect(exchange.setup).toBeCalledWith(defaultConfig);

    expect(strategy.setup).toBeCalledTimes(1);
    expect(strategy.setup).toBeCalledWith(exchange, socket, defaultConfig);
  });

  it('calls strategy loop function and setup interval when run', async () => {
    jest.useFakeTimers();
    jest.spyOn(global, 'setInterval');

    await main.run(strategy, socket, defaultConfig);

    expect(strategy.loop).toBeCalledTimes(1);
    expect(strategy.loop).toBeCalledWith(exchange, socket, defaultConfig);

    expect(setInterval).toBeCalledTimes(1);
    expect(setInterval).toBeCalledWith(
      expect.any(Function),
      15000,
      strategy,
      socket,
      defaultConfig
    );
  });

  describe('sim mode', () => {
    const config = { ...defaultConfig, sim: true };

    it('setups interval with time multiplier when run', async () => {
      jest.useFakeTimers();
      jest.spyOn(global, 'setInterval');

      await main.run(strategy, socket, config);

      expect(strategy.loop).toBeCalledTimes(1);
      expect(strategy.loop).toBeCalledWith(exchange, socket, config);

      expect(setInterval).toBeCalledTimes(1);
      expect(setInterval).toBeCalledWith(
        expect.any(Function),
        15000 / config.simConfig.timeMultiplier,
        strategy,
        socket,
        config
      );
    });

    it('calls exchange loop function when run', async () => {
      await main.run(strategy, socket, config);

      expect(exchange.loop).toBeCalledTimes(1);
    });
  });
});
