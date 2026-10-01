// Shared by the server page (first page) and the client listing. Kept out of the 'use client' module so the
// server receives plain values.
// 8 on phones (2-column grid = 4 rows), 12 elsewhere (fills 3- and 4-column grids evenly).
export const PAGE_SIZE_DESKTOP = 12;
export const PAGE_SIZE_PHONE = 8;
export const PHONE_QUERY = '(max-width: 639px)';
