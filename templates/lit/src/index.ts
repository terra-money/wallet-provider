//@ts-ignore
window.global = window;

import('./polyfills/polyfills').then(() => import('./app'));
