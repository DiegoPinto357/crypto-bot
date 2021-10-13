module.exports = class CustomIndicator {
  constructor({ initialData, calcFunc }) {
    this.data = initialData;
    this.calcFunc = calcFunc;
  }

  getResult() {
    return this.data;
  }

  nextValue(...args) {
    return this.calcFunc(this.data, ...args);
  }

  // TODO add this to technicalindicators
  lastValue() {
    return this.data.slice(-1)[0];
  }
};
