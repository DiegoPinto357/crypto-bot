const rewire = require('rewire');
const exchange = require('../exchange');
const rebalance = rewire('./rebalance');

jest.mock('../exchange');

const defaultConfig = {
  timeframe: '1m',
  loopPeriodRatio: 4,
  sim: false,
  simConfig: { timeMultiplier: 10 * 60 },
  strategy: {
    assets: {
      BTC: { share: 0.5 },
      ETH: { share: 0.25 },
      ADA: { share: 0.125 },
      BUSD: { share: 0.125 },
      BRL: { share: 0, ref: true },
    },
    balanceTrigger: 0.03,
  },
};

const balanceData = [
  { asset: 'ADA', amount: 27 },
  { asset: 'BRL', amount: 0 },
  { asset: 'BTC', amount: 0.003 },
  { asset: 'BUSD', amount: 41 },
  { asset: 'ETH', amount: 0.02 },
];

const socket = {};

describe('rebalance', () => {
  beforeEach(() => {
    exchange.fetchBalance.mockResolvedValue({
      free: {
        ADA: 27,
        BRL: 0,
        BTC: 0.003,
        BUSD: 41,
        DOGE: 300,
        ETH: 0.02,
        USDT: 20,
        XRP: 12,
      },
    });

    exchange.fetchTickers.mockResolvedValue({
      'BTC/BRL': { last: 306695.2013 },
      'ETH/BRL': { last: 22876.3566 },
      'ADA/BRL': { last: 8.638938 },
      'BUSD/BRL': { last: 5.6097 },
    });
  });

  it('fetches initial balance on setup', async () => {
    await rebalance.setup(exchange, socket, defaultConfig);

    expect(exchange.fetchBalance).toBeCalledTimes(1);
  });

  it('throws error if portfolio shares does not sums up to 1', async () => {
    // TODO use immer
    const config = {
      ...defaultConfig,
      strategy: {
        ...defaultConfig.strategy,
        assets: {
          BTC: { share: 0.5 },
          ETH: { share: 0.25 },
          ADA: { share: 0.25 },
          BUSD: { share: 0.25 },
          BRL: { share: 0, ref: true },
        },
      },
    };

    await expect(rebalance.setup(exchange, socket, config)).rejects.toThrow(
      'Portfolio shares must sum up to 1.'
    );
  });

  it('does not create orders if the portfolio is unbalanced below trigger value', async () => {
    await rebalance.setup(exchange, socket, defaultConfig);
    await rebalance.loop();

    expect(exchange.createOrder).not.toBeCalled();
  });

  it.skip('creates an order if the portfolio is unbalanced above trigger value', async () => {
    exchange.fetchTickers.mockResolvedValue({
      'BTC/BRL': { last: 366695.2013 },
      'ETH/BRL': { last: 22876.3566 },
      'ADA/BRL': { last: 8.638938 },
      'BUSD/BRL': { last: 5.6097 },
    });

    await rebalance.setup(exchange, socket, defaultConfig);
    await rebalance.loop();

    expect(exchange.createOrder).toBeCalled();
  });

  describe('getBalance', () => {
    const getBalance = rebalance.__get__('getBalance');

    beforeAll(
      async () => await rebalance.setup(exchange, socket, defaultConfig)
    );

    it('returns balance for given assets', async () => {
      const balance = await getBalance(['ADA', 'BTC', 'BRL', 'ETH', 'BUSD']);
      expect(balance).toEqual(balanceData);
    });
  });

  describe('getRefValues', () => {
    const getRefValues = rebalance.__get__('getRefValues');

    beforeAll(
      async () => await rebalance.setup(exchange, socket, defaultConfig)
    );

    it('gets values in terms of the ref asset', async () => {
      const refValues = await getRefValues(balanceData);
      expect(refValues).toEqual([
        { asset: 'ADA', amount: 27, refValue: 233.25132599999998 },
        { asset: 'BRL', amount: 0, refValue: 0 },
        { asset: 'BTC', amount: 0.003, refValue: 920.0856039 },
        { asset: 'BUSD', amount: 41, refValue: 229.9977 },
        { asset: 'ETH', amount: 0.02, refValue: 457.527132 },
      ]);
    });
  });

  describe.skip('orderByBalanceDiff', () => {
    const orderByBalanceDiff = rebalance.__get__('orderByBalanceDiff');

    beforeAll(
      async () => await rebalance.setup(exchange, socket, defaultConfig)
    );

    it('returns portfolio balance ordered by current asset shares', () => {
      const shares = orderByBalanceDiff(balanceData);
      expect(shares).toEqual([
        { asset: 'BTC', amount: 0.0003, share: 0.5 },
        { asset: 'ETH', amount: 0.02, share: 0.25 },
        { asset: 'ADA', amount: 0.02, share: 0.125 },
        { asset: 'BUSD', amount: 0.02, share: 0.125 },
        { asset: 'BRL', amount: 0.02, share: 0 },
      ]);
    });
  });
});
