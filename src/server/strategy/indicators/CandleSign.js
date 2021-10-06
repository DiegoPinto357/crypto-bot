module.exports = class CandleSign {
  constructor({ open, close }) {
    this.data = open.map((openValue, index) => {
      const closeValue = close[index];
      if (closeValue > openValue) return 1;
      if (closeValue < openValue) return -1;
      return 0;
    });
  }

  getResult() {
    return this.data;
  }

  nextValue({ open, close }) {
    if (close > open) return 1;
    if (close < open) return -1;
    return 0;
  }
};
