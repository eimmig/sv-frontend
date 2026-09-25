import { countAppliedFilters } from './applied-filters';

describe('countAppliedFilters', () => {
  it('counts only the filters with a value', () => {
    expect(countAppliedFilters(['sport-1', '', null, undefined, 'league-1'])).toBe(2);
  });

  it('counts non-string values, such as a chosen date', () => {
    expect(countAppliedFilters([new Date(2026, 0, 1), null])).toBe(1);
  });

  it('is zero when nothing is selected', () => {
    expect(countAppliedFilters(['', ''])).toBe(0);
  });
});
