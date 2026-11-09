import { clampPage, pageCount, pageSlice } from './paginate';

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, i) => i);

  it('counts at least one page, even for an empty list', () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(10)).toBe(1);
    expect(pageCount(25)).toBe(3);
  });

  it('slices the requested page and clamps a page outside the range', () => {
    expect(pageSlice(items, 0)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(pageSlice(items, 2)).toEqual([20, 21, 22, 23, 24]);
    expect(pageSlice(items, 9)).toEqual([20, 21, 22, 23, 24]);
    expect(pageSlice(items, -1)).toEqual(pageSlice(items, 0));
    expect(pageSlice([], 0)).toEqual([]);
  });

  it('clamps the page to the last one after the list shrinks', () => {
    expect(clampPage(2, 25)).toBe(2);
    expect(clampPage(2, 11)).toBe(1);
    expect(clampPage(-3, 11)).toBe(0);
  });
});
