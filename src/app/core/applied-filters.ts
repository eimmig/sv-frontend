export function countAppliedFilters(values: readonly unknown[]): number {
  return values.filter((value) => !!value).length;
}
