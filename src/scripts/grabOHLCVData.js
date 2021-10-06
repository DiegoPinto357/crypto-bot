require('dotenv').config();
const ccxt = require('ccxt');
const path = require('path');
const fs = require('fs');
const { writeFile, readFile, readdir } = fs.promises;

const config = {
  asset: 'BTC',
  base: 'USDT',
  timeframe: '1h',
};

const aggregatedFilenamePrefix = 'aggregated';

const getFolderName = ({ asset, base, timeframe }) =>
  path.join('src/server/cryptoData', `${asset}-${base}`, `${timeframe}`);

const saveFile = async (data, config) => {
  const firstTimeframe = data[0][0];
  const lastTimeframe = data.slice(-1)[0][0];

  const { filenamePrefix } = config;

  const filename = path.join(
    getFolderName(config),
    filenamePrefix
      ? `${filenamePrefix}-${firstTimeframe}-${lastTimeframe}.json`
      : `${firstTimeframe}-${lastTimeframe}.json`
  );

  console.log(`Saving data @${filename}`);
  await writeFile(filename, JSON.stringify(data));
};

const loadCurrentData = async folderName => {
  const allFiles = await readdir(folderName);

  const filterExp = new RegExp(aggregatedFilenamePrefix);
  const files = allFiles.filter(file => !filterExp.test(file));

  let data = [];

  for (const file of files) {
    const fileContent = await readFile(path.join(folderName, file), 'utf8');
    data.push(JSON.parse(fileContent));
  }

  return data;
};

const aggregateData = async folderName => {
  const currentData = await loadCurrentData(folderName);

  return currentData.reduce((aggragated, currentDataset) => {
    if (aggragated.length === 0) return [currentDataset];

    const lastDataset = aggragated.slice(-1)[0];

    const lastTimestamp = lastDataset.slice(-1)[0][0];
    const timestampIndex = currentDataset.findIndex(
      item => item[0] === lastTimestamp
    );

    if (timestampIndex === -1) {
      return [...aggragated, currentDataset];
    }

    aggragated[aggragated.length - 1] = [
      ...lastDataset,
      ...currentDataset.slice(timestampIndex + 1),
    ];
    return aggragated;
  }, []);
};

(async () => {
  const client = new ccxt.binance({
    apiKey: process.env.API_KEY,
    secret: process.env.API_SECRET,
  });

  const { asset, base, timeframe } = config;
  const market = `${asset}/${base}`;

  console.log('Fetching data...');
  const data = await client.fetchOHLCV(market, timeframe);

  await saveFile(data, config);

  console.log('Aggregating data...');
  const aggregated = await aggregateData(getFolderName(config));

  for (const data of aggregated) {
    await saveFile(data, {
      ...config,
      filenamePrefix: aggregatedFilenamePrefix,
    });
  }
})();
