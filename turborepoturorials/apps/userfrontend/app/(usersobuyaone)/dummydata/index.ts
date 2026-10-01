// TEMPORARY mock data for the Obuya One store. Do not delete until the backend is connected and the owner says so.
// Pages never import from here directly: services return this data in the exact shape documented in /api.md,
// so switching a page to the real backend only changes the service function.
export * from './sports';
export * from './apparel';
export * from './products';
export * from './store';
export * from './orders';
