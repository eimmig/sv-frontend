export const LIST_PAGE_SIZE = 10;

export function pageCount(total: number, size = LIST_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size));
}

/** Itens da página pedida, limitada ao intervalo válido (a lista pode ter encolhido). */
export function pageSlice<T>(items: readonly T[], page: number, size = LIST_PAGE_SIZE): T[] {
  const last = pageCount(items.length, size) - 1;
  const current = Math.min(Math.max(page, 0), last);
  return items.slice(current * size, current * size + size);
}

export function clampPage(page: number, total: number, size = LIST_PAGE_SIZE): number {
  return Math.min(Math.max(page, 0), pageCount(total, size) - 1);
}
