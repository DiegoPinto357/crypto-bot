module.exports = class CustomIndicator {
  constructor({ initialValue, calcFunc }) {
    this.data = [initialValue];
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
