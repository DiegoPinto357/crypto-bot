require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const main = require('./main');
const strategy = require('./strategy/rebalance');

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

io.on('connection', socket => {
  socket.sendBuffer = [];

  console.log('New client connected');

  const config = {
    asset: 'BTC',
    base: 'USDT',
    timeframe: '1m',
    loopPeriodRatio: 4,
    sandboxMode: true,
    sim: true,
    simConfig: {
      dataFile: 'aggregated-1632947880000-1633061880000.json',
      transientLength: 100,
      timeMultiplier: 10 * 60,
    },
  };

  main.run(strategy, socket, config);

  socket.on('disconnect', () => {
    main.stop();
    console.log('Client disconnected');
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
