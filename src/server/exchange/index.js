const ccxt = require('ccxt');
const exchange = require('./exchange');
const exchangeStub = require('./stub');

const getExchangeClient = async config => {
  const { sim, sandboxMode } = config;

  if (sim) {
    return await exchangeStub(config);
  }

  const client = new ccxt.binance(getCredentials(sandboxMode));
  client.setSandboxMode(sandboxMode);
  if (sandboxMode) console.log('Client is in sandbox mode.');
  return client;
};

const getCredentials = sandboxMode => {
  if (sandboxMode)
    return {
      apiKey: process.env.API_KEY_TEST,
      secret: process.env.API_SECRET_TEST,
    };

  return {
    apiKey: process.env.API_KEY,
    secret: process.env.API_SECRET,
  };
};

const setup = async config => {
  const client = await getExchangeClient(config);
  return await exchange.setup(client, config);
};

module.exports = {
  ...exchange,
  setup,
};
