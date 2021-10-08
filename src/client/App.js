import React, { useState, useEffect } from 'react';
import StockChart from './StockChart';
import socketIOClient from 'socket.io-client';
// import data from '../server/cryptoData/BTC-USDT/1m/aggregated-1632947880000-1633061880000.json';

const ENDPOINT = 'http://127.0.0.1:4001';

const App = () => {
  const [data, setData] = useState();
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);

    socket.on('FromAPI', setTimestamp);

    socket.on('data', setData);
  }, []);

  return (
    <div>
      <p>
        It's <time dateTime={timestamp}>{timestamp}</time>
      </p>
      <StockChart data={data} dateTimeFormat="%H:%M" />
    </div>
  );
};

export default App;
