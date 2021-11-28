let exchange;
let refAsset;

const verifyTargetPortfolioShares = targetPortfolio => {
  const total = Object.values(targetPortfolio).reduce(
    (sum, asset) => sum + asset.share,
    0
  );

  if (total !== 1) throw new Error('Portfolio shares must sum up to 1.');
};

const getBalance = async assets => {
  const rawBalance = await exchange.fetchBalance();

  return Object.entries(rawBalance.free)
    .filter(([key]) => assets.includes(key))
    .map(([key, value]) => ({ asset: key, amount: value }));
};

const getRefValues = async balance => {
  const assets = balance
    .map(item => item.asset)
    .filter(asset => asset !== refAsset);
  const tickers = await exchange.fetchTickers(assets);
  const tickersArray = Object.entries(tickers);

  return balance.map(item => {
    if (item.asset === refAsset) {
      return { ...item, refValue: item.amount };
    }

    const marketValue = tickersArray.find(([market]) =>
      market.match(item.asset)
    )[1].last;

    return { ...item, refValue: marketValue * item.amount };
  });
};

const orderByShare = balance => {
  const totalValue = Object.values(balance).reduce(
    (sum, value) => sum + value,
    0
  );

  return Object.entries(balance).reduce((balanceArray, [key, value]) => {}, []);
};

const setup = async (exchangeParam, socket, config) => {
  exchange = exchangeParam;

  const allAssets = Object.entries(config.strategy.assets);
  refAsset = allAssets.find(([key, value]) => value.ref)[0];
  const assets = allAssets
    .filter(([key]) => key !== refAsset)
    .map(([key]) => key);

  verifyTargetPortfolioShares(config.strategy.assets);
  await exchange.fetchBalance();
};

const loop = async () => {
  // const balance = await getBalance();
  // const shares = orderByShare(balance);
};

module.exports = {
  setup,
  loop,
};
