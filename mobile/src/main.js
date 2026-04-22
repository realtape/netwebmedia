import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

import { registerRoute, navigate } from './router.js';
import { getToken } from './api.js';

import { renderLogin } from './screens/login.js';
import { renderShell } from './screens/shell.js';

registerRoute('login', renderLogin);
registerRoute('shell', renderShell);

async function bootstrap() {
  if (Capacitor.isNativePlatform()) {
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#010F3B' });
    } catch (_) { /* web */ }
  }

  const token = await getToken();
  await navigate(token ? 'shell' : 'login');

  if (Capacitor.isNativePlatform()) {
    try { await SplashScreen.hide(); } catch (_) {}
  }
}

bootstrap().catch(err => {
  console.error('bootstrap failed', err);
  document.getElementById('app').innerHTML =
    `<div style="padding:24px;font-family:sans-serif">Startup error: ${err.message}</div>`;
});
