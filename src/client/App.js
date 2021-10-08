import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import StockChart from './StockChart';
import socketIOClient from 'socket.io-client';

const ENDPOINT = 'http://127.0.0.1:4001';

const App = () => {
  const [data, setData] = useState({ OHLCV: [], indicators: { rsi: [] } });

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);

    socket.on('data', newData => {
      const { OHLCV, indicators } = data;
      OHLCV.push(...newData.OHLCV);
      indicators.rsi.push(...newData.indicators.rsi);
      setData({ OHLCV, indicators });
    });
  }, []);

  return (
    <Box display="flex" direction="column" p={4}>
      <Box flex="1" width="100%">
        <StockChart data={data} dateTimeFormat="%H:%M" />
      </Box>
    </Box>
  );
};

export default App;
