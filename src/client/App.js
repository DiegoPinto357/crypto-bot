import StockChart from './StockChart';
import data from '../server/cryptoData/BTC-USDT/1m/aggregated-1632947880000-1633061880000.json';

const App = () => {
  return <StockChart data={data} dateTimeFormat="%H:%M" />;
};

export default App;
