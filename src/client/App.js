import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import StockChart from './StockChart';
import socketIOClient from 'socket.io-client';

const ENDPOINT = 'http://127.0.0.1:4001';

const processOrders = (openOrders, currentOrders) => {
  const newOrders = [...currentOrders];

  openOrders.forEach(order => {
    const existingOrder = newOrders.find(
      currentOrder => currentOrder.id === order.id
    );

    if (existingOrder) {
      existingOrder.status = order.status;
      return;
    }

    newOrders.push(order);
  });

  return newOrders;
};

const App = () => {
  const [data, setData] = useState({
    OHLCV: [],
    indicators: { rsi: [], macd: [] },
    custom: [],
  });

  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);

    socket.on('data', newData => {
      // setData(currentData => {
      //   const { OHLCV, indicators } = currentData;
      //   OHLCV.push(...newData.OHLCV);
      //   indicators.rsi.push(...newData.indicators.rsi);
      //   return { OHLCV, indicators };
      // });

      const { OHLCV, indicators, custom } = data;
      OHLCV.push(...newData.OHLCV);

      indicators.rsi.push(...newData.indicators.rsi);
      indicators.macd.push(
        ...newData.indicators.macd.map(({ MACD, signal, histogram }) => ({
          macd: MACD,
          signal,
          divergence: histogram,
        }))
      );

      newData.custom.forEach(newCustomCurve => {
        const customCurve = custom.find(
          curve => curve.name === newCustomCurve.name
        );

        if (customCurve) {
          customCurve.data.push(...newCustomCurve.data);
          return;
        }

        custom.push(newCustomCurve);
      });

      setData({ OHLCV, indicators, custom });
    });

    socket.on('openOrders', newOpenOrders => {
      setOrders(currentOrders => processOrders(newOpenOrders, currentOrders));
    });

    socket.on('openOrder', newOrder => {
      setOrders(currentOrders => [...currentOrders, newOrder]);
    });
  }, []);

  return (
    <Box display="flex" direction="column" p={4}>
      <Box flex="1" width="100%">
        <StockChart data={data} orders={orders} dateTimeFormat="%H:%M" />
      </Box>
    </Box>
  );
};

export default App;
