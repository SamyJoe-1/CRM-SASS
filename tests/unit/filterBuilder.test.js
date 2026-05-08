const { applyFilters } = require('../../src/utils/filterBuilder');

describe('applyFilters', () => {
  it('is importable without errors', () => {
    expect(typeof applyFilters).toBe('function');
  });
});
