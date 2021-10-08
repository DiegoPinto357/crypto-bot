require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const data = require('../server/cryptoData/BTC-USDT/1m/fav-1633105080000-1633135020000.json');

const port = 4001;

const app = express();

app.get('/', (req, res) => {
  res.send({ response: 'I am alive' }).status(200);
});

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});

const getApiAndEmit = socket => {
  const response = new Date();
  socket.emit('FromAPI', response);
};

let interval;

io.on('connection', socket => {
  console.log('New client connected');

  socket.emit('data', data);

  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => getApiAndEmit(socket), 1000);
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));

// const main = require('./main');

// const config = {
//   asset: 'BTC',
//   base: 'USDT',
//   timeframe: '1h',
//   loopPeriodRatio: 12,
//   sandboxMode: true,
//   sim: true,
//   simConfig: {
//     dataFile: 'aggregated-1631678400000-1633482000000.json',
//     transientLength: 100,
//     timeMultiplier: 200 * 60,
//   },
// };

// main.run(config);
