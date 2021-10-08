import React, { useState, useEffect } from 'react';
import StockChart from './StockChart';
import socketIOClient from 'socket.io-client';

const ENDPOINT = 'http://127.0.0.1:4001';

const App = () => {
  const [data, setData] = useState({});
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
      <StockChart data={data.OHLCV} dateTimeFormat="%H:%M" />
    </div>
  );
};

export default App;
