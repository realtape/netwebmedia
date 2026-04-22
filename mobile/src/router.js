const routes = new Map();
let currentRoute = null;

export function registerRoute(name, render) {
  routes.set(name, render);
}

export async function navigate(name, params = {}) {
  const render = routes.get(name);
  if (!render) throw new Error(`Unknown route: ${name}`);
  currentRoute = name;
  const root = document.getElementById('app');
  root.innerHTML = '';
  await render(root, params);
}

export function getCurrentRoute() {
  return currentRoute;
}
