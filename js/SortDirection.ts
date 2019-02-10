export enum SortDirection {
    ASCENDING = "ascending",
    DESCENDING = "descending"
}

export type SortMultiplier = -1 | 1;

export function getSortMultiplier(sortDirection: SortDirection): SortMultiplier {
    return sortDirection === SortDirection.ASCENDING ? 1 : -1;
}
