const { getPagination, buildMeta } = require('../../src/utils/pagination');

describe('getPagination', () => {
  it('defaults to page 1, per_page 20', () => {
    const { page, per_page } = getPagination({});
    expect(page).toBe(1);
    expect(per_page).toBe(20);
  });

  it('caps per_page at 100', () => {
    const { per_page } = getPagination({ per_page: '9999' });
    expect(per_page).toBe(100);
  });

  it('calculates correct offset', () => {
    const { offset } = getPagination({ page:'3', per_page:'10' });
    expect(offset).toBe(20);
  });
});

describe('buildMeta', () => {
  it('calculates total_pages', () => {
    const meta = buildMeta(1, 10, 25);
    expect(meta.total_pages).toBe(3);
  });
});
