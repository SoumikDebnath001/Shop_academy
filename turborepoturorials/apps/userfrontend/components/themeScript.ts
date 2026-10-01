// Kept outside the 'use client' ThemeProvider so the server layout receives the plain string.
export const THEME_STORAGE_KEY = 'obuya-theme';

// Runs in <head> before paint so the saved (or system) theme applies without a light/dark flash.
export const themeInitScript = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}`;
