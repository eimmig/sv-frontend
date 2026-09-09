/** Matches the pagination envelope every paginated Java endpoint returns (docs/API-CONTRACTS.md). */
export interface PagedResponse<T> {
  readonly content: T[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}
