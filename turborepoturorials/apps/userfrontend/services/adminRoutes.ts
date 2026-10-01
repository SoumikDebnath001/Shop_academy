// The admin panel lives on its own URL, separate from the store. Keep this in sync with the app/grassroots-admin folder name.
export const ADMIN_BASE_PATH = '/grassroots-admin';
export const ADMIN_LOGIN_PATH = `${ADMIN_BASE_PATH}/login`;

export const adminPath = (path = '') => `${ADMIN_BASE_PATH}${path}`;
