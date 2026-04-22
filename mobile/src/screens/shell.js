import { renderHome } from './home.js';
import { renderChat } from './chat.js';
import { renderLeads } from './leads.js';
import { renderAccount } from './account.js';

const TABS = [
  { id: 'home',    label: 'Home',   icon: '🏠', render: renderHome },
  { id: 'leads',   label: 'Leads',  icon: '👤', render: renderLeads },
  { id: 'chat',    label: 'AI',     icon: '✨', render: renderChat },
  { id: 'account', label: 'Me',     icon: '⚙️', render: renderAccount }
];

let activeTab = 'home';

export function renderShell(root) {
  root.innerHTML = `
    <div class="screen" id="screen"></div>
    <nav class="tabs" id="tabs"></nav>
  `;

  const tabsEl = root.querySelector('#tabs');
  TABS.forEach(t => {
    const b = document.createElement('button');
    b.className = 'tab' + (t.id === activeTab ? ' active' : '');
    b.innerHTML = `<span class="icon">${t.icon}</span>${t.label}`;
    b.addEventListener('click', () => selectTab(t.id));
    tabsEl.appendChild(b);
  });

  selectTab(activeTab);

  function selectTab(id) {
    activeTab = id;
    [...tabsEl.children].forEach((el, i) => {
      el.classList.toggle('active', TABS[i].id === id);
    });
    const tab = TABS.find(t => t.id === id);
    const screen = root.querySelector('#screen');
    screen.innerHTML = '';
    tab.render(screen);
  }
}
