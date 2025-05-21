module.exports = {
  createChart: jest.fn().mockImplementation(() => ({
    applyOptions: jest.fn(),
    addSeries: jest.fn().mockImplementation(() => ({
      setData: jest.fn(),
      applyOptions: jest.fn(),
    })),
    timeScale: jest.fn().mockReturnValue({
      fitContent: jest.fn(),
    }),
    subscribeCrosshairMove: jest.fn(),
    unsubscribeCrosshairMove: jest.fn(),
    remove: jest.fn(),
  })),
  CandlestickSeries: {},
  HistogramSeries: {},
  LineSeries: {},
};
