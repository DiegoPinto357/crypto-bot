const asciichart = require('asciichart');

const plot = (data, config) => {
  const width = 150;

  let plotData;

  if (!Array.isArray(data[0])) plotData = [data];
  else plotData = data;

  const slicedData = plotData.map(serie => serie.slice(-width));

  const filteredData = slicedData
    .map(serie => serie.filter(value => value !== undefined))
    .filter(serie => serie.length > 0);

  const offset = width - filteredData[0].length;

  console.log(
    asciichart.plot(filteredData, { ...config, offset: offset + 10 })
  );
};

module.exports = {
  plot,
};
