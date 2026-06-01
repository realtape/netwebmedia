const {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo
} = React;

/* ============================================================================
   DATA LAYER  (swappable persistence)
   ----------------------------------------------------------------------------
   v1 = localStorage. To move to Supabase/API later, replace the body of
   Store.get / Store.set with async calls (and make usePersistentState async).
   Every collection is namespaced; nothing else in the app touches localStorage.
   ========================================================================== */
const Store = {
  driver: 'local',
  // future: 'supabase' | 'api'
  ns: 'nwm_cc_v2',
  key(coll) {
    return `${this.ns}:${coll}`;
  },
  get(coll, fallback) {
    try {
      const raw = localStorage.getItem(this.key(coll));
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  },
  set(coll, value) {
    try {
      localStorage.setItem(this.key(coll), JSON.stringify(value));
    } catch (e) {}
    // FUTURE (Supabase):  await supabase.from(coll).upsert(value)
  },
  wipe() {
    Object.keys(localStorage).filter(k => k.startsWith(this.ns + ':')).forEach(k => localStorage.removeItem(k));
  }
};
function usePersistentState(coll, initial) {
  const [state, setState] = useState(() => {
    const stored = Store.get(coll, undefined);
    return stored === undefined ? typeof initial === 'function' ? initial() : initial : stored;
  });
  useEffect(() => {
    Store.set(coll, state);
  }, [coll, state]);
  return [state, setState];
}

/* ============================================================================
   i18n  (Spanish default)
   ========================================================================== */
const STRINGS = {
  es: {
    'app.title': 'Centro de Comando de Lanzamiento',
    'app.subtitle': 'NetWebMedia · Mes 1',
    'nav.readiness': 'Preparación',
    'nav.revenue': 'Ingresos',
    'nav.marketing': 'Plan de Marketing',
    'nav.connections': 'Conexiones',
    'header.launchOn': 'Lanzamiento: lun 1 jun 2026',
    'header.daysToLaunch': 'días para el lanzamiento',
    'header.launched': '¡EN VIVO! Mes 1 en curso',
    'header.reset': 'Reiniciar datos demo',
    'header.confirmReset': '¿Borrar todos los datos guardados y recargar la demo?',
    'common.owner': 'Responsable',
    'common.due': 'Fecha límite',
    'common.notes': 'Notas',
    'common.status': 'Estado',
    'common.actionItems': 'Acciones pendientes',
    'common.allClear': 'Todo en orden — sin acciones pendientes.',
    'common.export': 'Exportar CSV',
    'common.regenerate': 'Regenerar plan',
    'common.add': 'Agregar',
    'common.delete': 'Eliminar',
    'common.of': 'de',
    'common.none': '—',
    'status.not_started': 'Sin iniciar',
    'status.in_progress': 'En progreso',
    'status.blocked': 'Bloqueado',
    'status.done': 'Hecho',
    'toggle.yes': 'Sí',
    'toggle.no': 'No',
    'toggle.partial': 'Parcial',
    'toggle.na': 'N/A',
    'readiness.summary': 'Puntaje de preparación',
    'readiness.gonogo': 'Decisión de lanzamiento',
    'readiness.go': 'GO — listo para lanzar',
    'readiness.caution': 'PRECAUCIÓN — críticos OK, faltan detalles',
    'readiness.nogo': 'NO-GO — bloqueado',
    'readiness.criticalDone': 'críticos completos',
    'readiness.arm': 'Activar lanzamiento',
    'readiness.armed': '🚀 LANZAMIENTO ACTIVADO',
    'readiness.disarm': 'Desactivar',
    'readiness.blockedMsg': 'Completa todos los ítems críticos para activar el lanzamiento.',
    'readiness.blockedCount': 'críticos pendientes',
    'sections.offer': 'Oferta lista',
    'sections.channels': 'Canales funcionando',
    'sections.crm': 'CRM funcional',
    'sections.prod': 'Listo para producción',
    'channels.account': 'Cuenta conectada',
    'channels.posting': 'Publicación probada',
    'channels.analytics': 'Analítica / píxel',
    'channels.token': 'Token API válido',
    'channels.complete': 'completo',
    'revenue.summary': 'Ingreso recurrente reservado (MRR)',
    'revenue.target': 'Meta',
    'revenue.booked': 'Reservado',
    'revenue.gap': 'Faltante',
    'revenue.daysLeft': 'días restantes en el mes',
    'revenue.addDeal': 'Registrar venta',
    'revenue.mix': 'Calculadora de mezcla de ventas',
    'revenue.mixHint': 'Cuántas de cada tier para alcanzar la meta',
    'revenue.contact': 'Cliente',
    'revenue.tier': 'Plan',
    'revenue.amount': 'Monto (USD)',
    'revenue.dealStatus': 'Estado',
    'revenue.closed': 'Cerrada',
    'revenue.pending': 'Pendiente',
    'revenue.date': 'Fecha',
    'revenue.deals': 'Ventas registradas',
    'revenue.noDeals': 'Aún no hay ventas registradas.',
    'revenue.toClose': 'Para cerrar la brecha',
    'revenue.more': 'más',
    'revenue.settings': 'Metas y precios',
    'revenue.pace': 'Ritmo necesario',
    'revenue.perDay': '/día',
    'revenue.blend': 'Mezcla combinada de ejemplo',
    'revenue.roundExample': 'número redondo',
    'revenue.toExceed': 'para superar la meta',
    'marketing.summary': 'Publicaciones del mes (5/día × 30 días)',
    'marketing.posts': 'publicaciones',
    'marketing.live': 'En vivo de Carlos',
    'marketing.week': 'Semana',
    'marketing.pillar': 'Pilar',
    'marketing.format': 'Formato',
    'marketing.hook': 'Gancho',
    'marketing.cta': 'CTA',
    'marketing.platform': 'Plataforma',
    'marketing.rollup': 'Resumen semanal',
    'marketing.reach': 'Alcance',
    'marketing.engagement': 'Interacción',
    'marketing.leads': 'Leads',
    'marketing.conversions': 'Conversiones',
    'marketing.posted': 'publicadas',
    'marketing.filterAll': 'Todas',
    'marketing.confirmRegen': '¿Regenerar el calendario? Se perderán ediciones y KPIs.',
    'connections.summary': 'Plataformas conectadas',
    'connections.connected': 'Conectado',
    'connections.disconnected': 'Desconectado',
    'connections.lastTested': 'Última prueba',
    'connections.testNow': 'Probar ahora',
    'connections.never': 'Nunca',
    'connections.excluded': 'Excluida del mix NWM',
    'pillar.educational': 'Educativo',
    'pillar.social_proof': 'Prueba social / caso',
    'pillar.offer_promo': 'Oferta / promo',
    'pillar.behind_scenes': 'Detrás de cámaras',
    'pillar.thought_leadership': 'Liderazgo de opinión',
    'poststatus.draft': 'Borrador',
    'poststatus.scheduled': 'Programado',
    'poststatus.posted': 'Publicado'
  },
  en: {
    'app.title': 'Launch Command Center',
    'app.subtitle': 'NetWebMedia · Month 1',
    'nav.readiness': 'Readiness',
    'nav.revenue': 'Revenue',
    'nav.marketing': 'Marketing Plan',
    'nav.connections': 'Connections',
    'header.launchOn': 'Launch: Mon Jun 1, 2026',
    'header.daysToLaunch': 'days to launch',
    'header.launched': 'LIVE! Month 1 in progress',
    'header.reset': 'Reset demo data',
    'header.confirmReset': 'Erase all saved data and reload the demo?',
    'common.owner': 'Owner',
    'common.due': 'Due date',
    'common.notes': 'Notes',
    'common.status': 'Status',
    'common.actionItems': 'Action items',
    'common.allClear': 'All clear — no action items.',
    'common.export': 'Export CSV',
    'common.regenerate': 'Regenerate plan',
    'common.add': 'Add',
    'common.delete': 'Delete',
    'common.of': 'of',
    'common.none': '—',
    'status.not_started': 'Not Started',
    'status.in_progress': 'In Progress',
    'status.blocked': 'Blocked',
    'status.done': 'Done',
    'toggle.yes': 'Yes',
    'toggle.no': 'No',
    'toggle.partial': 'Partial',
    'toggle.na': 'N/A',
    'readiness.summary': 'Readiness score',
    'readiness.gonogo': 'Launch decision',
    'readiness.go': 'GO — ready to launch',
    'readiness.caution': 'CAUTION — criticals OK, details pending',
    'readiness.nogo': 'NO-GO — blocked',
    'readiness.criticalDone': 'criticals complete',
    'readiness.arm': 'Arm launch',
    'readiness.armed': '🚀 LAUNCH ARMED',
    'readiness.disarm': 'Disarm',
    'readiness.blockedMsg': 'Complete all critical items to arm the launch.',
    'readiness.blockedCount': 'criticals pending',
    'sections.offer': 'Offer Ready',
    'sections.channels': 'Channels Working',
    'sections.crm': 'CRM Functional',
    'sections.prod': 'Production Readiness',
    'channels.account': 'Account connected',
    'channels.posting': 'Posting tested',
    'channels.analytics': 'Analytics / pixel',
    'channels.token': 'API token valid',
    'channels.complete': 'complete',
    'revenue.summary': 'Monthly recurring revenue booked (MRR)',
    'revenue.target': 'Target',
    'revenue.booked': 'Booked',
    'revenue.gap': 'Gap',
    'revenue.daysLeft': 'days left in month',
    'revenue.addDeal': 'Log a sale',
    'revenue.mix': 'Deal mix calculator',
    'revenue.mixHint': 'How many of each tier to hit the target',
    'revenue.contact': 'Client',
    'revenue.tier': 'Tier',
    'revenue.amount': 'Amount (USD)',
    'revenue.dealStatus': 'Status',
    'revenue.closed': 'Closed',
    'revenue.pending': 'Pending',
    'revenue.date': 'Date',
    'revenue.deals': 'Logged sales',
    'revenue.noDeals': 'No sales logged yet.',
    'revenue.toClose': 'To close the gap',
    'revenue.more': 'more',
    'revenue.settings': 'Targets & pricing',
    'revenue.pace': 'Required pace',
    'revenue.perDay': '/day',
    'revenue.blend': 'Sample blended mix',
    'revenue.roundExample': 'round number',
    'revenue.toExceed': 'to exceed target',
    'marketing.summary': 'Posts this month (5/day × 30 days)',
    'marketing.posts': 'posts',
    'marketing.live': 'Carlos daily live',
    'marketing.week': 'Week',
    'marketing.pillar': 'Pillar',
    'marketing.format': 'Format',
    'marketing.hook': 'Hook line',
    'marketing.cta': 'CTA',
    'marketing.platform': 'Platform',
    'marketing.rollup': 'Weekly rollup',
    'marketing.reach': 'Reach',
    'marketing.engagement': 'Engagement',
    'marketing.leads': 'Leads',
    'marketing.conversions': 'Conversions',
    'marketing.posted': 'posted',
    'marketing.filterAll': 'All',
    'marketing.confirmRegen': 'Regenerate the calendar? Edits and KPIs will be lost.',
    'connections.summary': 'Platforms connected',
    'connections.connected': 'Connected',
    'connections.disconnected': 'Disconnected',
    'connections.lastTested': 'Last tested',
    'connections.testNow': 'Test now',
    'connections.never': 'Never',
    'connections.excluded': 'Excluded from NWM mix',
    'pillar.educational': 'Educational',
    'pillar.social_proof': 'Social proof / case',
    'pillar.offer_promo': 'Offer / promo',
    'pillar.behind_scenes': 'Behind the scenes',
    'pillar.thought_leadership': 'Thought leadership',
    'poststatus.draft': 'Draft',
    'poststatus.scheduled': 'Scheduled',
    'poststatus.posted': 'Posted'
  }
};

/* ============================================================================
   CONFIG / CONSTANTS
   ========================================================================== */
// 8 platforms used consistently across Readiness channels, Connections, Marketing.
// LinkedIn + X are included per the build spec, but flagged `excluded` because
// NetWebMedia's durable social policy drops them. Toggle as needed.
const PLATFORMS = [{
  id: 'google',
  name: 'Google',
  color: '#4285F4',
  critical: true,
  excluded: false,
  formats: ['GBP post / update']
}, {
  id: 'facebook',
  name: 'Facebook',
  color: '#1877F2',
  critical: true,
  excluded: false,
  formats: ['Cross-post from IG + community']
}, {
  id: 'instagram',
  name: 'Instagram',
  color: '#E1306C',
  critical: true,
  excluded: false,
  formats: ['Reel 9:16', 'Feed 4:5 carousel', 'Feed 1:1']
}, {
  id: 'tiktok',
  name: 'TikTok',
  color: '#010101',
  critical: true,
  excluded: false,
  formats: ['9:16 vertical · hook ≤3s · 15–30s']
}, {
  id: 'youtube',
  name: 'YouTube',
  color: '#FF0000',
  critical: true,
  excluded: false,
  formats: ['Short 9:16', 'Long-form']
}, {
  id: 'whatsapp',
  name: 'WhatsApp',
  color: '#25D366',
  critical: false,
  excluded: false,
  formats: ['Broadcast / Status']
}, {
  id: 'linkedin',
  name: 'LinkedIn',
  color: '#0A66C2',
  critical: false,
  excluded: true,
  formats: ['Text + carousel/document · ≤1300 char']
}, {
  id: 'x',
  name: 'X',
  color: '#111111',
  critical: false,
  excluded: true,
  formats: ['Text + image · thread · ≤280 char']
}];
const POSTING_PLATFORMS = PLATFORMS.filter(p => ['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'x'].includes(p.id));
const PILLARS = ['educational', 'social_proof', 'offer_promo', 'behind_scenes', 'thought_leadership'];
const STATUS_OPTS = ['not_started', 'in_progress', 'blocked', 'done'];
const POST_STATUS_OPTS = ['draft', 'scheduled', 'posted'];
const LAUNCH_DATE = new Date(2026, 5, 1); // Mon Jun 1, 2026
const MONTH_END = new Date(2026, 5, 30); // Jun 30, 2026
const MONTH_DAYS = 30;
const CTAS = {
  es: ['Agenda tu auditoría AEO gratis', "Escribe 'AEO' por DM", 'Link en bio → precios', 'Empieza AEO Starter $249', 'Agenda una llamada'],
  en: ['Book your free AEO audit', "DM us 'AEO'", 'Link in bio → pricing', 'Start AEO Starter $249', 'Book a call']
};
const HOOKS = {
  es: {
    educational: ['Por qué la IA no cita tu negocio (y cómo arreglarlo)', '3 errores de AEO que cometen las pymes', 'Cómo ChatGPT elige a quién recomendar'],
    social_proof: ['Auditamos 50 sitios — esto encontramos', 'De invisible a citado por IA en 30 días', 'Caso real: +40% de leads con AEO'],
    offer_promo: ['CMO fraccional por menos que un becario', 'Tu marketing completo desde $249/mes', 'Última semana: setup AEO sin costo'],
    behind_scenes: ['Cómo construimos un CMO con IA', 'Un día montando campañas para 14 nichos', 'Lo que nadie te muestra de una agencia con IA'],
    thought_leadership: ['El SEO murió. Llega el AEO.', 'Por qué 2026 es el año de la búsqueda con IA', 'Google Maps vs IA: dónde aparecer']
  },
  en: {
    educational: ["Why AI isn't citing your business (and the fix)", '3 AEO mistakes SMBs make', 'How ChatGPT decides who to recommend'],
    social_proof: ['We audited 50 sites — here is what we found', 'From invisible to AI-cited in 30 days', 'Real case: +40% leads with AEO'],
    offer_promo: ['A fractional CMO for less than an intern', 'Your whole marketing from $249/mo', 'Last week: free AEO setup'],
    behind_scenes: ['How we built an AI-powered CMO', 'A day building campaigns for 14 niches', 'What no agency shows you behind the scenes'],
    thought_leadership: ['SEO is dead. Enter AEO.', 'Why 2026 is the year of AI search', 'Google Maps vs AI: where to show up']
  }
};
const LIVE_TOPICS = {
  es: ['AEO en vivo: preguntas y respuestas', 'Auditoría de marca en directo', 'Detrás de una campaña real', 'Demo del CRM NetWebMedia', 'Tendencias de marketing con IA'],
  en: ['AEO live Q&A', 'Live brand audit', 'Behind a real campaign', 'NetWebMedia CRM demo', 'AI marketing trends']
};

/* ============================================================================
   SEED DATA BUILDERS
   ========================================================================== */
function seedReadiness() {
  const mk = (id, en, es, critical, opts = {}) => ({
    id,
    label_en: en,
    label_es: es,
    critical,
    status: opts.status || 'not_started',
    toggle: opts.toggle || 'no',
    owner: opts.owner || '',
    due: opts.due || '',
    notes: opts.notes || ''
  });
  return [{
    id: 'offer',
    type: 'items',
    items: [mk('offer_tiers', 'Are the 3 tiers fully defined (deliverables, scope, SLAs)?', '¿Los 3 planes están definidos (entregables, alcance, SLAs)?', true, {
      status: 'in_progress',
      toggle: 'partial',
      owner: 'Carlos'
    }), mk('offer_pricing', 'Pricing page live', 'Página de precios publicada', true, {
      status: 'done',
      toggle: 'yes',
      owner: 'Eng'
    }), mk('offer_contracts', 'Contracts / proposals templated', 'Contratos / propuestas con plantilla', true, {
      owner: 'Carlos'
    }), mk('offer_payments', 'Payment processing live (MercadoPago/Stripe)', 'Procesamiento de pagos activo (MercadoPago/Stripe)', true, {
      status: 'in_progress',
      toggle: 'partial'
    })]
  }, {
    id: 'channels',
    type: 'channels',
    platforms: PLATFORMS.map(p => ({
      id: p.id,
      name: p.name,
      critical: p.critical,
      excluded: p.excluded,
      account: false,
      posting: false,
      analytics: false,
      token: false,
      note: p.excluded ? 'Excluida del mix NWM (LinkedIn/X) — solo seguimiento.' : ''
    }))
  }, {
    id: 'crm',
    type: 'items',
    items: [mk('crm_form', 'Lead capture form works', 'Formulario de captura de leads funciona', true, {
      status: 'done',
      toggle: 'yes'
    }), mk('crm_pipeline', 'Pipeline stages defined', 'Etapas del pipeline definidas', true, {
      status: 'done',
      toggle: 'yes'
    }), mk('crm_autos', 'Automations firing', 'Automatizaciones disparándose', false, {
      status: 'in_progress',
      toggle: 'partial'
    }), mk('crm_sequences', 'Email sequences live', 'Secuencias de email activas', false, {
      status: 'in_progress',
      toggle: 'partial'
    }), mk('crm_attribution', 'Source attribution working', 'Atribución de origen funcionando', false), mk('crm_e2e', 'Test lead flows end-to-end', 'Un lead de prueba fluye de extremo a extremo', true)]
  }, {
    id: 'prod',
    type: 'items',
    items: [mk('prod_env', 'Environment config (config.local.php / secrets)', 'Config de entorno (config.local.php / secretos)', true, {
      status: 'done',
      toggle: 'yes'
    }), mk('prod_errors', 'Error monitoring (Sentry)', 'Monitoreo de errores (Sentry)', false, {
      status: 'done',
      toggle: 'yes'
    }), mk('prod_backups', 'Backups verified', 'Respaldos verificados', false, {
      status: 'in_progress',
      toggle: 'partial'
    }), mk('prod_dns', 'Domain / DNS verified', 'Dominio / DNS verificado', true, {
      status: 'done',
      toggle: 'yes'
    }), mk('prod_mobile', 'Mobile responsive verified', 'Responsivo móvil verificado', false, {
      status: 'in_progress',
      toggle: 'partial'
    })]
  }];
}
function seedDeals() {
  return [{
    id: 'd1',
    contact: 'Clínica Andes',
    tier: 'growth',
    amount: 999,
    status: 'closed',
    date: '2026-06-03'
  }, {
    id: 'd2',
    contact: 'Viña del Mar Tours',
    tier: 'starter',
    amount: 249,
    status: 'closed',
    date: '2026-06-05'
  }, {
    id: 'd3',
    contact: 'Estudio Jurídico Rojas',
    tier: 'premium',
    amount: 2490,
    status: 'pending',
    date: '2026-06-08'
  }];
}
function seedConnections() {
  // mock connection states + last-tested timestamps (anchored within Month 1)
  const base = '2026-05-29T14:00:00';
  return PLATFORMS.map((p, i) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    excluded: p.excluded,
    connected: !p.excluded && i % 4 !== 3,
    lastTested: p.excluded ? null : i % 3 === 0 ? base : i % 3 === 1 ? '2026-05-28T09:30:00' : null
  }));
}
function genCalendar(lang) {
  const days = [];
  for (let d = 1; d <= MONTH_DAYS; d++) {
    const date = new Date(2026, 5, d);
    const dow = date.getDay(); // 0 Sun .. 6 Sat
    const posts = [];
    for (let s = 0; s < 5; s++) {
      const plat = POSTING_PLATFORMS[(d + s) % POSTING_PLATFORMS.length];
      const pillar = PILLARS[(d + s) % PILLARS.length];
      const fmt = plat.formats[(d + s) % plat.formats.length];
      const hookList = HOOKS[lang][pillar];
      const hook = hookList[(d + s) % hookList.length];
      const cta = CTAS[lang][(d + s) % CTAS[lang].length];
      posts.push({
        id: `p-${d}-${s}`,
        platform: plat.id,
        format: fmt,
        pillar,
        hook,
        cta,
        status: 'draft',
        reach: 0,
        engagement: 0,
        leads: 0,
        conversions: 0
      });
    }
    const liveTopic = LIVE_TOPICS[lang][(d - 1) % LIVE_TOPICS[lang].length];
    const livePlat = POSTING_PLATFORMS[(d - 1) % POSTING_PLATFORMS.length];
    days.push({
      day: d,
      dow,
      week: Math.floor((d - 1) / 7) + 1,
      posts,
      live: {
        platform: livePlat.id,
        topic: liveTopic,
        status: 'scheduled'
      }
    });
  }
  return days;
}

/* ============================================================================
   COMPUTED STATS
   ========================================================================== */
function readinessStats(sections) {
  let total = 0,
    done = 0,
    critTotal = 0,
    critDone = 0,
    blocked = 0;
  const pending = []; // critical not-done
  sections.forEach(sec => {
    if (sec.type === 'channels') {
      sec.platforms.forEach(p => {
        const flags = [p.account, p.posting, p.analytics, p.token];
        total += 4;
        done += flags.filter(Boolean).length;
        const complete = flags.every(Boolean);
        if (p.critical) {
          critTotal++;
          if (complete) critDone++;else pending.push({
            sec: 'channels',
            label: p.name
          });
        }
      });
    } else {
      sec.items.forEach(it => {
        if (it.toggle === 'na') return; // N/A excluded from scoring
        total += 1;
        done += it.status === 'done' ? 1 : it.status === 'in_progress' ? 0.5 : 0;
        if (it.status === 'blocked') blocked++;
        if (it.critical) {
          critTotal++;
          if (it.status === 'done') critDone++;else pending.push({
            sec: sec.id,
            label: it.label_en,
            item: it
          });
        }
      });
    }
  });
  const pct = total ? Math.round(done / total * 100) : 0;
  const criticalComplete = critTotal > 0 && critDone === critTotal;
  let decision = 'nogo';
  if (criticalComplete) decision = pct >= 90 ? 'go' : 'caution';
  return {
    pct,
    critTotal,
    critDone,
    criticalComplete,
    blocked,
    decision,
    pending
  };
}
function channelStats(sec) {
  if (!sec || sec.type !== 'channels') return {
    pct: 0
  };
  let t = 0,
    d = 0;
  sec.platforms.forEach(p => {
    t += 4;
    d += [p.account, p.posting, p.analytics, p.token].filter(Boolean).length;
  });
  return {
    pct: t ? Math.round(d / t * 100) : 0
  };
}
function daysLeftInMonth() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ms = MONTH_END - today;
  if (ms < 0) return 0;
  return Math.floor(ms / 86400000) + 1;
}
function daysToLaunch() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((LAUNCH_DATE - today) / 86400000);
}

/* ============================================================================
   SMALL UI PRIMITIVES
   ========================================================================== */
const fmtMoney = n => '$' + Math.round(n).toLocaleString('en-US');
function SummaryStat({
  label,
  value,
  sub,
  accent
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `rounded-2xl px-6 py-5 ${accent ? 'bg-orange text-white' : 'bg-navy text-white'} shadow-lg`
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs uppercase tracking-wider opacity-70"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "font-display text-4xl font-extrabold mt-1 leading-none"
  }, value), sub && /*#__PURE__*/React.createElement("div", {
    className: "text-sm opacity-80 mt-1"
  }, sub));
}
function ProgressBar({
  pct,
  color = 'bg-orange',
  height = 'h-3'
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `w-full ${height} bg-slate-200 rounded-full overflow-hidden`
  }, /*#__PURE__*/React.createElement("div", {
    className: `bar-fill ${height} ${color} rounded-full`,
    style: {
      width: Math.min(100, pct) + '%'
    }
  }));
}
function Card({
  title,
  right,
  children,
  className = ''
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `bg-white rounded-2xl shadow-sm border border-slate-200 ${className}`
  }, (title || right) && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between px-5 py-3 border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-display font-bold text-navy"
  }, title), right), /*#__PURE__*/React.createElement("div", {
    className: "p-5"
  }, children));
}
function ActionItems({
  t,
  items
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "bg-amber-50 border border-amber-200 rounded-2xl p-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-amber-600"
  }, "\u26A0\uFE0F"), /*#__PURE__*/React.createElement("h3", {
    className: "font-display font-bold text-navy"
  }, t('common.actionItems'))), items.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500"
  }, t('common.allClear')) : /*#__PURE__*/React.createElement("ul", {
    className: "space-y-1.5"
  }, items.map((it, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    className: "text-sm text-navy flex gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-orange font-bold"
  }, "\u2192"), /*#__PURE__*/React.createElement("span", null, it)))));
}
const STATUS_STYLE = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  blocked: 'bg-red-100 text-red-700',
  done: 'bg-green-100 text-green-700'
};
const TOGGLE_STYLE = {
  yes: 'bg-green-500 text-white',
  no: 'bg-slate-200 text-slate-600',
  partial: 'bg-amber-400 text-white',
  na: 'bg-slate-300 text-slate-500'
};

/* ============================================================================
   READINESS VIEW
   ========================================================================== */
function ReadinessView({
  t,
  lang,
  sections,
  setSections,
  armed,
  setArmed
}) {
  const stats = useMemo(() => readinessStats(sections), [sections]);
  const updateItem = (secId, itemId, patch) => {
    setSections(prev => prev.map(sec => sec.id !== secId ? sec : {
      ...sec,
      items: sec.items.map(it => it.id === itemId ? {
        ...it,
        ...patch
      } : it)
    }));
  };
  const updateChannel = (platId, patch) => {
    setSections(prev => prev.map(sec => sec.type !== 'channels' ? sec : {
      ...sec,
      platforms: sec.platforms.map(p => p.id === platId ? {
        ...p,
        ...patch
      } : p)
    }));
  };
  const decisionStyle = {
    go: 'bg-green-500',
    caution: 'bg-amber-400',
    nogo: 'bg-red-500'
  }[stats.decision];
  const actionList = stats.pending.map(p => `${p.sec === 'channels' ? t('sections.channels') + ': ' + p.label : p.item ? lang === 'es' ? p.item.label_es : p.item.label_en : p.label}`);
  if (stats.blocked > 0) actionList.unshift(`${stats.blocked} ${lang === 'es' ? 'ítem(s) bloqueado(s) por resolver' : 'blocked item(s) to resolve'}`);
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, /*#__PURE__*/React.createElement(SummaryStat, {
    label: t('readiness.summary'),
    value: stats.pct + '%',
    sub: `${stats.critDone}/${stats.critTotal} ${t('readiness.criticalDone')}`
  }), /*#__PURE__*/React.createElement("div", {
    className: `md:col-span-2 rounded-2xl px-6 py-5 text-white shadow-lg ${decisionStyle} flex items-center justify-between`
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "text-xs uppercase tracking-wider opacity-80"
  }, t('readiness.gonogo')), /*#__PURE__*/React.createElement("div", {
    className: "font-display text-3xl font-extrabold mt-1"
  }, t('readiness.' + stats.decision))), /*#__PURE__*/React.createElement("div", {
    className: "text-right"
  }, armed ? /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-display font-extrabold text-lg"
  }, t('readiness.armed')), /*#__PURE__*/React.createElement("button", {
    onClick: () => setArmed(false),
    className: "text-xs bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5"
  }, t('readiness.disarm'))) : /*#__PURE__*/React.createElement("button", {
    disabled: !stats.criticalComplete,
    onClick: () => setArmed(true),
    className: `rounded-xl px-5 py-3 font-bold transition ${stats.criticalComplete ? 'bg-navy hover:bg-navy2 text-white' : 'bg-white/30 text-white/60 cursor-not-allowed'}`
  }, t('readiness.arm')), !armed && !stats.criticalComplete && /*#__PURE__*/React.createElement("div", {
    className: "text-xs opacity-90 mt-2 max-w-[14rem]"
  }, t('readiness.blockedMsg'))))), /*#__PURE__*/React.createElement(ProgressBar, {
    pct: stats.pct
  }), sections.map(sec => /*#__PURE__*/React.createElement(Card, {
    key: sec.id,
    title: t('sections.' + sec.id),
    right: sec.type === 'channels' && /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-slate-500"
    }, channelStats(sec).pct, "% ", t('channels.complete'))
  }, sec.type === 'channels' ? /*#__PURE__*/React.createElement(ChannelGrid, {
    t: t,
    sec: sec,
    updateChannel: updateChannel
  }) : /*#__PURE__*/React.createElement(ItemTable, {
    t: t,
    lang: lang,
    sec: sec,
    updateItem: updateItem
  }))), /*#__PURE__*/React.createElement(ActionItems, {
    t: t,
    items: actionList
  }));
}
function ItemTable({
  t,
  lang,
  sec,
  updateItem
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-slate-400 text-xs uppercase"
  }, /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-3 font-semibold w-1/3"
  }, "Item"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 px-2 font-semibold"
  }, "Y/N"), /*#__PURE__*/React.createElement("th", {
    className: "py-2 px-2 font-semibold"
  }, t('common.status')), /*#__PURE__*/React.createElement("th", {
    className: "py-2 px-2 font-semibold"
  }, t('common.owner')), /*#__PURE__*/React.createElement("th", {
    className: "py-2 px-2 font-semibold"
  }, t('common.due')), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pl-2 font-semibold"
  }, t('common.notes')))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, sec.items.map(it => /*#__PURE__*/React.createElement("tr", {
    key: it.id,
    className: "align-top"
  }, /*#__PURE__*/React.createElement("td", {
    className: "py-2.5 pr-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-navy"
  }, lang === 'es' ? it.label_es : it.label_en), it.critical && /*#__PURE__*/React.createElement("span", {
    className: "ml-2 text-[10px] font-bold text-orange bg-orange/10 rounded px-1.5 py-0.5 align-middle"
  }, "CR\xCDTICO")), /*#__PURE__*/React.createElement("td", {
    className: "py-2.5 px-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-flex rounded-lg overflow-hidden border border-slate-200"
  }, ['yes', 'partial', 'no', 'na'].map(v => /*#__PURE__*/React.createElement("button", {
    key: v,
    onClick: () => updateItem(sec.id, it.id, {
      toggle: v
    }),
    className: `px-2 py-1 text-xs ${it.toggle === v ? TOGGLE_STYLE[v] : 'bg-white text-slate-400 hover:bg-slate-50'}`
  }, t('toggle.' + v))))), /*#__PURE__*/React.createElement("td", {
    className: "py-2.5 px-2"
  }, /*#__PURE__*/React.createElement("select", {
    value: it.status,
    onChange: e => updateItem(sec.id, it.id, {
      status: e.target.value
    }),
    className: `text-xs rounded-lg px-2 py-1 border-0 focus-ring cursor-pointer ${STATUS_STYLE[it.status]}`
  }, STATUS_OPTS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s,
    value: s
  }, t('status.' + s))))), /*#__PURE__*/React.createElement("td", {
    className: "py-2.5 px-2"
  }, /*#__PURE__*/React.createElement("input", {
    value: it.owner,
    onChange: e => updateItem(sec.id, it.id, {
      owner: e.target.value
    }),
    placeholder: "\u2014",
    className: "w-20 text-xs bg-slate-50 rounded-lg px-2 py-1 focus-ring"
  })), /*#__PURE__*/React.createElement("td", {
    className: "py-2.5 px-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: it.due,
    onChange: e => updateItem(sec.id, it.id, {
      due: e.target.value
    }),
    className: "text-xs bg-slate-50 rounded-lg px-2 py-1 focus-ring"
  })), /*#__PURE__*/React.createElement("td", {
    className: "py-2.5 pl-2"
  }, /*#__PURE__*/React.createElement("input", {
    value: it.notes,
    onChange: e => updateItem(sec.id, it.id, {
      notes: e.target.value
    }),
    placeholder: "\u2026",
    className: "w-40 text-xs bg-slate-50 rounded-lg px-2 py-1 focus-ring"
  })))))));
}
function ChannelGrid({
  t,
  sec,
  updateChannel
}) {
  const cols = [['account', 'channels.account'], ['posting', 'channels.posting'], ['analytics', 'channels.analytics'], ['token', 'channels.token']];
  return /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-slate-400 text-xs uppercase"
  }, /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-3 font-semibold"
  }, t('marketing.platform')), cols.map(([k, label]) => /*#__PURE__*/React.createElement("th", {
    key: k,
    className: "py-2 px-2 font-semibold text-center"
  }, t(label))), /*#__PURE__*/React.createElement("th", {
    className: "py-2 pl-2 font-semibold"
  }, t('common.notes')))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, sec.platforms.map(p => {
    const complete = [p.account, p.posting, p.analytics, p.token].every(Boolean);
    return /*#__PURE__*/React.createElement("tr", {
      key: p.id
    }, /*#__PURE__*/React.createElement("td", {
      className: "py-2.5 pr-3"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-medium text-navy"
    }, p.name), p.critical && /*#__PURE__*/React.createElement("span", {
      className: "ml-2 text-[10px] font-bold text-orange"
    }, "\u2022"), p.excluded && /*#__PURE__*/React.createElement("span", {
      className: "ml-2 text-[10px] text-slate-400"
    }, "(", t('connections.excluded'), ")"), complete && /*#__PURE__*/React.createElement("span", {
      className: "ml-2 text-green-500"
    }, "\u2713")), cols.map(([k]) => /*#__PURE__*/React.createElement("td", {
      key: k,
      className: "py-2.5 px-2 text-center"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => updateChannel(p.id, {
        [k]: !p[k]
      }),
      className: `w-9 h-6 rounded-full transition relative ${p[k] ? 'bg-green-500' : 'bg-slate-300'}`
    }, /*#__PURE__*/React.createElement("span", {
      className: `absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${p[k] ? 'left-3.5' : 'left-0.5'}`
    })))), /*#__PURE__*/React.createElement("td", {
      className: "py-2.5 pl-2"
    }, /*#__PURE__*/React.createElement("input", {
      value: p.note,
      onChange: e => updateChannel(p.id, {
        note: e.target.value
      }),
      placeholder: "\u2026",
      className: "w-44 text-xs bg-slate-50 rounded-lg px-2 py-1 focus-ring"
    })));
  }))));
}

/* ============================================================================
   REVENUE VIEW
   ========================================================================== */
function RevenueView({
  t,
  lang,
  deals,
  setDeals,
  config,
  setConfig
}) {
  const tiers = config.tiers;
  const tierMap = Object.fromEntries(tiers.map(x => [x.key, x]));
  const booked = deals.filter(d => d.status === 'closed').reduce((s, d) => s + Number(d.amount || 0), 0);
  const pending = deals.filter(d => d.status === 'pending').reduce((s, d) => s + Number(d.amount || 0), 0);
  const target = config.target;
  const pct = target ? booked / target * 100 : 0;
  const gap = Math.max(0, target - booked);
  const dleft = daysLeftInMonth();
  const pace = dleft > 0 ? gap / dleft : gap;
  const [form, setForm] = useState({
    contact: '',
    tier: 'growth',
    amount: tierMap.growth?.price || 999,
    status: 'closed',
    date: '2026-06-01'
  });
  const [showSettings, setShowSettings] = useState(false);
  const addDeal = () => {
    if (!form.contact.trim()) return;
    setDeals(prev => [...prev, {
      ...form,
      id: 'd' + Date.now(),
      amount: Number(form.amount)
    }]);
    setForm(f => ({
      ...f,
      contact: ''
    }));
  };
  const onTier = key => setForm(f => ({
    ...f,
    tier: key,
    amount: tierMap[key].price
  }));
  const removeDeal = id => setDeals(prev => prev.filter(d => d.id !== id));
  const sampleBlend = useMemo(() => {
    // simple greedy sample to ~ target using premium/growth/starter
    const p = tierMap.premium.price,
      g = tierMap.growth.price,
      s = tierMap.starter.price;
    const nP = Math.floor(target / p / 2); // a couple premium
    let rem = target - nP * p;
    const nG = Math.floor(rem / g);
    rem -= nG * g;
    const nS = Math.ceil(rem / s);
    const total = nP * p + nG * g + nS * s;
    return {
      nP,
      nG,
      nS,
      total
    };
  }, [target, tierMap]);
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid md:grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement(SummaryStat, {
    label: t('revenue.summary'),
    value: fmtMoney(booked),
    sub: `${Math.round(pct)}% ${t('common.of')} ${fmtMoney(target)}`,
    accent: true
  }), /*#__PURE__*/React.createElement(SummaryStat, {
    label: t('revenue.gap'),
    value: fmtMoney(gap),
    sub: `${fmtMoney(pending)} ${lang === 'es' ? 'en pendientes' : 'in pending'}`
  }), /*#__PURE__*/React.createElement(SummaryStat, {
    label: t('revenue.daysLeft'),
    value: dleft,
    sub: t('header.launchOn')
  }), /*#__PURE__*/React.createElement(SummaryStat, {
    label: t('revenue.pace'),
    value: fmtMoney(pace) + t('revenue.perDay'),
    sub: lang === 'es' ? 'para cerrar la brecha' : 'to close the gap'
  })), /*#__PURE__*/React.createElement(Card, {
    title: `${t('revenue.booked')} ${fmtMoney(booked)} / ${fmtMoney(target)}`,
    right: /*#__PURE__*/React.createElement("button", {
      onClick: () => setShowSettings(s => !s),
      className: "text-xs text-orange hover:underline"
    }, "\u2699 ", t('revenue.settings'))
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    pct: pct,
    height: "h-5"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-xs text-slate-400 mt-1"
  }, /*#__PURE__*/React.createElement("span", null, "$0"), /*#__PURE__*/React.createElement("span", null, fmtMoney(target))), showSettings && /*#__PURE__*/React.createElement("div", {
    className: "mt-4 grid sm:grid-cols-4 gap-3 bg-slate-50 rounded-xl p-4"
  }, /*#__PURE__*/React.createElement("label", {
    className: "text-xs text-slate-500"
  }, t('revenue.target'), " (USD)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: config.target,
    onChange: e => setConfig(c => ({
      ...c,
      target: Number(e.target.value)
    })),
    className: "mt-1 w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus-ring"
  })), tiers.map((tr, i) => /*#__PURE__*/React.createElement("label", {
    key: tr.key,
    className: "text-xs text-slate-500"
  }, tr.label, " (USD/mes)", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: tr.price,
    onChange: e => setConfig(c => {
      const nt = [...c.tiers];
      nt[i] = {
        ...nt[i],
        price: Number(e.target.value)
      };
      return {
        ...c,
        tiers: nt
      };
    }),
    className: "mt-1 w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus-ring"
  }))))), /*#__PURE__*/React.createElement(Card, {
    title: t('revenue.mix'),
    right: /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-slate-400"
    }, t('revenue.mixHint'))
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, tiers.map(tr => {
    const toTarget = Math.ceil(target / tr.price);
    const roundN = Math.floor(target / tr.price);
    const toClose = Math.ceil(gap / tr.price);
    return /*#__PURE__*/React.createElement("div", {
      key: tr.key,
      className: "rounded-xl border border-slate-200 p-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-baseline justify-between"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-display font-bold text-navy"
    }, tr.label), /*#__PURE__*/React.createElement("span", {
      className: "text-orange font-bold"
    }, fmtMoney(tr.price), "/mo")), /*#__PURE__*/React.createElement("div", {
      className: "mt-3 space-y-1.5 text-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-slate-500"
    }, t('revenue.roundExample')), /*#__PURE__*/React.createElement("span", {
      className: "font-semibold"
    }, roundN, "\xD7 = ", fmtMoney(roundN * tr.price))), /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-slate-500"
    }, t('revenue.toExceed')), /*#__PURE__*/React.createElement("span", {
      className: "font-semibold text-navy"
    }, toTarget, "\xD7 = ", fmtMoney(toTarget * tr.price))), /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between border-t border-slate-100 pt-1.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-slate-500"
    }, t('revenue.toClose')), /*#__PURE__*/React.createElement("span", {
      className: "font-bold text-orange"
    }, toClose, " ", t('revenue.more')))));
  })), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 text-sm bg-navy text-white rounded-xl px-4 py-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "opacity-70"
  }, t('revenue.blend'), ": "), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, sampleBlend.nP, "\xD7 ", tierMap.premium.label, " + ", sampleBlend.nG, "\xD7 ", tierMap.growth.label, " + ", sampleBlend.nS, "\xD7 ", tierMap.starter.label, " = ", fmtMoney(sampleBlend.total)))), /*#__PURE__*/React.createElement(Card, {
    title: t('revenue.addDeal')
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid sm:grid-cols-6 gap-3 items-end"
  }, /*#__PURE__*/React.createElement("label", {
    className: "text-xs text-slate-500 sm:col-span-2"
  }, t('revenue.contact'), /*#__PURE__*/React.createElement("input", {
    value: form.contact,
    onChange: e => setForm(f => ({
      ...f,
      contact: e.target.value
    })),
    className: "mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus-ring"
  })), /*#__PURE__*/React.createElement("label", {
    className: "text-xs text-slate-500"
  }, t('revenue.tier'), /*#__PURE__*/React.createElement("select", {
    value: form.tier,
    onChange: e => onTier(e.target.value),
    className: "mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus-ring"
  }, tiers.map(tr => /*#__PURE__*/React.createElement("option", {
    key: tr.key,
    value: tr.key
  }, tr.label)))), /*#__PURE__*/React.createElement("label", {
    className: "text-xs text-slate-500"
  }, t('revenue.amount'), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: form.amount,
    onChange: e => setForm(f => ({
      ...f,
      amount: e.target.value
    })),
    className: "mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus-ring"
  })), /*#__PURE__*/React.createElement("label", {
    className: "text-xs text-slate-500"
  }, t('revenue.dealStatus'), /*#__PURE__*/React.createElement("select", {
    value: form.status,
    onChange: e => setForm(f => ({
      ...f,
      status: e.target.value
    })),
    className: "mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus-ring"
  }, /*#__PURE__*/React.createElement("option", {
    value: "closed"
  }, t('revenue.closed')), /*#__PURE__*/React.createElement("option", {
    value: "pending"
  }, t('revenue.pending')))), /*#__PURE__*/React.createElement("button", {
    onClick: addDeal,
    className: "bg-orange hover:bg-orange2 text-white rounded-lg px-4 py-2 text-sm font-semibold"
  }, t('common.add'))), /*#__PURE__*/React.createElement("div", {
    className: "mt-5 overflow-x-auto"
  }, deals.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-400"
  }, t('revenue.noDeals')) : /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-slate-400 text-xs uppercase"
  }, /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-3 font-semibold"
  }, t('revenue.contact')), /*#__PURE__*/React.createElement("th", {
    className: "py-2 px-2 font-semibold"
  }, t('revenue.tier')), /*#__PURE__*/React.createElement("th", {
    className: "py-2 px-2 font-semibold"
  }, t('revenue.amount')), /*#__PURE__*/React.createElement("th", {
    className: "py-2 px-2 font-semibold"
  }, t('revenue.dealStatus')), /*#__PURE__*/React.createElement("th", {
    className: "py-2 px-2 font-semibold"
  }, t('revenue.date')), /*#__PURE__*/React.createElement("th", null))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, deals.map(d => /*#__PURE__*/React.createElement("tr", {
    key: d.id
  }, /*#__PURE__*/React.createElement("td", {
    className: "py-2 pr-3 text-navy"
  }, d.contact), /*#__PURE__*/React.createElement("td", {
    className: "py-2 px-2"
  }, tierMap[d.tier]?.label || d.tier), /*#__PURE__*/React.createElement("td", {
    className: "py-2 px-2 font-semibold"
  }, fmtMoney(d.amount)), /*#__PURE__*/React.createElement("td", {
    className: "py-2 px-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-xs rounded-full px-2 py-0.5 ${d.status === 'closed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`
  }, t('revenue.' + d.status))), /*#__PURE__*/React.createElement("td", {
    className: "py-2 px-2 text-slate-500"
  }, d.date), /*#__PURE__*/React.createElement("td", {
    className: "py-2 text-right"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => removeDeal(d.id),
    className: "text-slate-300 hover:text-red-500 text-xs"
  }, "\u2715")))))))), /*#__PURE__*/React.createElement(ActionItems, {
    t: t,
    items: gap > 0 ? [`${lang === 'es' ? 'Cerrar' : 'Close'} ${fmtMoney(gap)} ${lang === 'es' ? 'más para llegar a la meta' : 'more to hit target'}`, `${lang === 'es' ? 'Equivale a' : 'That is'} ${Math.ceil(gap / tierMap.growth.price)}× ${tierMap.growth.label} ${lang === 'es' ? 'o' : 'or'} ${Math.ceil(gap / tierMap.starter.price)}× ${tierMap.starter.label}`, ...(pending > 0 ? [`${lang === 'es' ? 'Dar seguimiento a' : 'Follow up on'} ${fmtMoney(pending)} ${lang === 'es' ? 'en ventas pendientes' : 'in pending deals'}`] : [])] : []
  }));
}

/* ============================================================================
   MARKETING VIEW
   ========================================================================== */
const PostRow = memo(function PostRow({
  t,
  lang,
  post,
  dayNum,
  onChange
}) {
  const plat = PLATFORMS.find(p => p.id === post.platform);
  return /*#__PURE__*/React.createElement("tr", {
    className: "align-top hover:bg-slate-50"
  }, /*#__PURE__*/React.createElement("td", {
    className: "py-2 pr-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-1.5 text-xs font-semibold",
    style: {
      color: plat?.color
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full",
    style: {
      background: plat?.color
    }
  }), plat?.name)), /*#__PURE__*/React.createElement("td", {
    className: "py-2 px-2 text-xs text-slate-500"
  }, post.format), /*#__PURE__*/React.createElement("td", {
    className: "py-2 px-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs rounded-full bg-navy/5 text-navy px-2 py-0.5"
  }, t('pillar.' + post.pillar))), /*#__PURE__*/React.createElement("td", {
    className: "py-2 px-2 text-xs text-navy max-w-[16rem]"
  }, post.hook), /*#__PURE__*/React.createElement("td", {
    className: "py-2 px-2 text-xs text-slate-500"
  }, post.cta), /*#__PURE__*/React.createElement("td", {
    className: "py-2 px-2"
  }, /*#__PURE__*/React.createElement("select", {
    value: post.status,
    onChange: e => onChange(dayNum, post.id, {
      status: e.target.value
    }),
    className: `text-xs rounded-lg px-2 py-1 border-0 focus-ring cursor-pointer ${post.status === 'posted' ? 'bg-green-100 text-green-700' : post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`
  }, POST_STATUS_OPTS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s,
    value: s
  }, t('poststatus.' + s))))), ['reach', 'engagement', 'leads', 'conversions'].map(k => /*#__PURE__*/React.createElement("td", {
    key: k,
    className: "py-2 px-1"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: post[k],
    onChange: e => onChange(dayNum, post.id, {
      [k]: Number(e.target.value)
    }),
    className: "w-16 text-xs bg-slate-50 rounded-lg px-1.5 py-1 focus-ring text-right"
  }))));
});
function MarketingView({
  t,
  lang,
  calendar,
  setCalendar
}) {
  const [week, setWeek] = useState(0); // 0 = all
  const totalPosts = calendar.reduce((s, d) => s + d.posts.length, 0);
  const postedPosts = calendar.reduce((s, d) => s + d.posts.filter(p => p.status === 'posted').length, 0);
  const draftPosts = calendar.reduce((s, d) => s + d.posts.filter(p => p.status === 'draft').length, 0);
  const onPostChange = useCallback((dayNum, postId, patch) => {
    setCalendar(prev => prev.map(d => d.day !== dayNum ? d : {
      ...d,
      posts: d.posts.map(p => p.id === postId ? {
        ...p,
        ...patch
      } : p)
    }));
  }, [setCalendar]);
  const regenerate = () => {
    if (window.confirm(t('marketing.confirmRegen'))) setCalendar(genCalendar(lang));
  };
  const exportCSV = () => {
    const rows = [['Date', 'Weekday', 'Type', 'Platform', 'Format', 'Pillar', 'Hook', 'CTA', 'Status', 'Reach', 'Engagement', 'Leads', 'Conversions']];
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    calendar.forEach(d => {
      const date = `2026-06-${String(d.day).padStart(2, '0')}`;
      d.posts.forEach(p => {
        const plat = PLATFORMS.find(x => x.id === p.platform);
        rows.push([date, dow[d.dow], 'Post', plat?.name, p.format, t('pillar.' + p.pillar), p.hook, p.cta, t('poststatus.' + p.status), p.reach, p.engagement, p.leads, p.conversions]);
      });
      const lp = PLATFORMS.find(x => x.id === d.live.platform);
      rows.push([date, dow[d.dow], 'Carlos Live', lp?.name, 'Live stream', '—', d.live.topic, '—', t('poststatus.' + d.live.status), '', '', '', '']);
    });
    const csv = rows.map(r => r.map(c => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'netwebmedia-month1-calendar.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // weekly rollups
  const weeks = useMemo(() => {
    const map = {};
    calendar.forEach(d => {
      const w = d.week;
      map[w] = map[w] || {
        week: w,
        reach: 0,
        engagement: 0,
        leads: 0,
        conversions: 0,
        posts: 0,
        posted: 0
      };
      d.posts.forEach(p => {
        map[w].reach += p.reach;
        map[w].engagement += p.engagement;
        map[w].leads += p.leads;
        map[w].conversions += p.conversions;
        map[w].posts++;
        if (p.status === 'posted') map[w].posted++;
      });
    });
    return Object.values(map).sort((a, b) => a.week - b.week);
  }, [calendar]);
  const dow = lang === 'es' ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const visibleDays = week === 0 ? calendar : calendar.filter(d => d.week === week);
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid md:grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement(SummaryStat, {
    label: t('marketing.summary'),
    value: totalPosts,
    sub: `+ 30 ${t('marketing.live')}`,
    accent: true
  }), /*#__PURE__*/React.createElement(SummaryStat, {
    label: t('marketing.posted'),
    value: `${postedPosts}/${totalPosts}`,
    sub: `${Math.round(postedPosts / totalPosts * 100)}%`
  }), /*#__PURE__*/React.createElement(SummaryStat, {
    label: t('poststatus.draft'),
    value: draftPosts,
    sub: lang === 'es' ? 'por preparar' : 'to prepare'
  }), /*#__PURE__*/React.createElement("div", {
    className: "rounded-2xl px-6 py-5 bg-navy text-white shadow-lg flex flex-col justify-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: exportCSV,
    className: "bg-orange hover:bg-orange2 rounded-lg px-3 py-2 text-sm font-semibold"
  }, "\u2B07 ", t('common.export')), /*#__PURE__*/React.createElement("button", {
    onClick: regenerate,
    className: "bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-sm"
  }, "\u21BB ", t('common.regenerate')))), /*#__PURE__*/React.createElement(Card, {
    title: t('marketing.rollup')
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-slate-400 text-xs uppercase"
  }, /*#__PURE__*/React.createElement("th", {
    className: "py-2 pr-3 font-semibold"
  }, t('marketing.week')), /*#__PURE__*/React.createElement("th", {
    className: "py-2 px-2 font-semibold"
  }, t('marketing.posted')), /*#__PURE__*/React.createElement("th", {
    className: "py-2 px-2 font-semibold"
  }, t('marketing.reach')), /*#__PURE__*/React.createElement("th", {
    className: "py-2 px-2 font-semibold"
  }, t('marketing.engagement')), /*#__PURE__*/React.createElement("th", {
    className: "py-2 px-2 font-semibold"
  }, t('marketing.leads')), /*#__PURE__*/React.createElement("th", {
    className: "py-2 px-2 font-semibold"
  }, t('marketing.conversions')))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, weeks.map(w => /*#__PURE__*/React.createElement("tr", {
    key: w.week
  }, /*#__PURE__*/React.createElement("td", {
    className: "py-2 pr-3 font-medium text-navy"
  }, t('marketing.week'), " ", w.week), /*#__PURE__*/React.createElement("td", {
    className: "py-2 px-2"
  }, w.posted, "/", w.posts), /*#__PURE__*/React.createElement("td", {
    className: "py-2 px-2"
  }, w.reach.toLocaleString()), /*#__PURE__*/React.createElement("td", {
    className: "py-2 px-2"
  }, w.engagement.toLocaleString()), /*#__PURE__*/React.createElement("td", {
    className: "py-2 px-2 font-semibold text-orange"
  }, w.leads), /*#__PURE__*/React.createElement("td", {
    className: "py-2 px-2 font-semibold text-green-600"
  }, w.conversions))))))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 flex-wrap"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setWeek(0),
    className: `px-3 py-1.5 rounded-lg text-sm ${week === 0 ? 'bg-navy text-white' : 'bg-white border border-slate-200 text-slate-600'}`
  }, t('marketing.filterAll')), [1, 2, 3, 4, 5].map(w => /*#__PURE__*/React.createElement("button", {
    key: w,
    onClick: () => setWeek(w),
    className: `px-3 py-1.5 rounded-lg text-sm ${week === w ? 'bg-navy text-white' : 'bg-white border border-slate-200 text-slate-600'}`
  }, t('marketing.week'), " ", w))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, visibleDays.map(d => {
    const lp = PLATFORMS.find(x => x.id === d.live.platform);
    return /*#__PURE__*/React.createElement(Card, {
      key: d.day,
      title: `${dow[d.dow]} · ${lang === 'es' ? 'Jun' : 'Jun'} ${d.day}`,
      right: /*#__PURE__*/React.createElement("span", {
        className: "text-xs text-slate-400"
      }, t('marketing.week'), " ", d.week)
    }, /*#__PURE__*/React.createElement("div", {
      className: "overflow-x-auto"
    }, /*#__PURE__*/React.createElement("table", {
      className: "w-full text-sm"
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
      className: "text-left text-slate-400 text-[10px] uppercase"
    }, /*#__PURE__*/React.createElement("th", {
      className: "py-1 pr-2 font-semibold"
    }, t('marketing.platform')), /*#__PURE__*/React.createElement("th", {
      className: "py-1 px-2 font-semibold"
    }, t('marketing.format')), /*#__PURE__*/React.createElement("th", {
      className: "py-1 px-2 font-semibold"
    }, t('marketing.pillar')), /*#__PURE__*/React.createElement("th", {
      className: "py-1 px-2 font-semibold"
    }, t('marketing.hook')), /*#__PURE__*/React.createElement("th", {
      className: "py-1 px-2 font-semibold"
    }, t('marketing.cta')), /*#__PURE__*/React.createElement("th", {
      className: "py-1 px-2 font-semibold"
    }, t('common.status')), /*#__PURE__*/React.createElement("th", {
      className: "py-1 px-1 font-semibold text-right"
    }, t('marketing.reach')), /*#__PURE__*/React.createElement("th", {
      className: "py-1 px-1 font-semibold text-right"
    }, t('marketing.engagement')), /*#__PURE__*/React.createElement("th", {
      className: "py-1 px-1 font-semibold text-right"
    }, t('marketing.leads')), /*#__PURE__*/React.createElement("th", {
      className: "py-1 px-1 font-semibold text-right"
    }, t('marketing.conversions')))), /*#__PURE__*/React.createElement("tbody", {
      className: "divide-y divide-slate-100"
    }, d.posts.map(p => /*#__PURE__*/React.createElement(PostRow, {
      key: p.id,
      t: t,
      lang: lang,
      post: p,
      dayNum: d.day,
      onChange: onPostChange
    }))))), /*#__PURE__*/React.createElement("div", {
      className: "mt-3 flex items-center gap-2 bg-orange/5 border border-orange/20 rounded-xl px-3 py-2 text-sm"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-orange font-bold"
    }, "\uD83D\uDD34 ", t('marketing.live'), ":"), /*#__PURE__*/React.createElement("span", {
      className: "font-semibold",
      style: {
        color: lp?.color
      }
    }, lp?.name), /*#__PURE__*/React.createElement("span", {
      className: "text-slate-500"
    }, "\u2014 ", d.live.topic)));
  })), /*#__PURE__*/React.createElement(ActionItems, {
    t: t,
    items: draftPosts > 0 ? [`${draftPosts} ${lang === 'es' ? 'publicaciones aún en borrador' : 'posts still in Draft'}`] : []
  }));
}

/* ============================================================================
   CONNECTIONS VIEW
   ========================================================================== */
function ConnectionsView({
  t,
  lang,
  connections,
  setConnections
}) {
  const connectedCount = connections.filter(c => c.connected).length;
  const nowISO = () => new Date().toISOString().slice(0, 16);
  const toggle = id => setConnections(prev => prev.map(c => c.id === id ? {
    ...c,
    connected: !c.connected
  } : c));
  const testNow = id => setConnections(prev => prev.map(c => c.id === id ? {
    ...c,
    connected: true,
    lastTested: nowISO()
  } : c));
  const fmtTime = iso => {
    if (!iso) return t('connections.never');
    return iso.replace('T', ' ');
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, /*#__PURE__*/React.createElement(SummaryStat, {
    label: t('connections.summary'),
    value: `${connectedCount}/${connections.length}`,
    sub: `${Math.round(connectedCount / connections.length * 100)}% ${t('connections.connected').toLowerCase()}`,
    accent: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
  }, connections.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    className: `rounded-2xl border p-5 bg-white shadow-sm ${c.connected ? 'border-green-300' : 'border-slate-200'}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-3 h-3 rounded-full",
    style: {
      background: c.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-display font-bold text-navy"
  }, c.name)), /*#__PURE__*/React.createElement("span", {
    className: `w-2.5 h-2.5 rounded-full ${c.connected ? 'bg-green-500' : 'bg-slate-300'}`
  })), /*#__PURE__*/React.createElement("div", {
    className: `mt-3 text-sm font-semibold ${c.connected ? 'text-green-600' : 'text-slate-400'}`
  }, c.connected ? '● ' + t('connections.connected') : '○ ' + t('connections.disconnected')), c.excluded && /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-slate-400 mt-1"
  }, t('connections.excluded')), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400 mt-2"
  }, t('connections.lastTested'), ": ", fmtTime(c.lastTested)), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => testNow(c.id),
    className: "flex-1 bg-orange hover:bg-orange2 text-white rounded-lg px-2 py-1.5 text-xs font-semibold"
  }, t('connections.testNow')), /*#__PURE__*/React.createElement("button", {
    onClick: () => toggle(c.id),
    className: "bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg px-2 py-1.5 text-xs"
  }, c.connected ? t('connections.disconnect') || '⏏' : '⏻'))))), /*#__PURE__*/React.createElement(ActionItems, {
    t: t,
    items: connections.filter(c => !c.connected && !c.excluded).map(c => `${lang === 'es' ? 'Conectar y probar' : 'Connect & test'} ${c.name}`)
  }));
}

/* ============================================================================
   APP SHELL
   ========================================================================== */
function App() {
  const [lang, setLang] = usePersistentState('lang', 'es');
  const [view, setView] = usePersistentState('view', 'readiness');
  const [armed, setArmed] = usePersistentState('armed', false);
  const [sections, setSections] = usePersistentState('readiness', seedReadiness);
  const [deals, setDeals] = usePersistentState('deals', seedDeals);
  const [connections, setConnections] = usePersistentState('connections', seedConnections);
  const [config, setConfig] = usePersistentState('config', () => ({
    target: 5000,
    tiers: [{
      key: 'starter',
      label: 'AEO Starter',
      price: 249
    }, {
      key: 'growth',
      label: 'CMO Growth',
      price: 999
    },
    // Defaulting to canonical $2,490 (Carlos reconfirmed 2026-05-22). Editable above.
    {
      key: 'premium',
      label: 'CMO Premium',
      price: 2490
    }]
  }));
  const [calendar, setCalendar] = usePersistentState('calendar', () => genCalendar('es'));
  const t = useCallback(k => STRINGS[lang] && STRINGS[lang][k] || k, [lang]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const dtl = daysToLaunch();
  const reset = () => {
    if (window.confirm(t('header.confirmReset'))) {
      Store.wipe();
      location.reload();
    }
  };
  const nav = [['readiness', '✅'], ['revenue', '💰'], ['marketing', '📅'], ['connections', '🔌']];
  return /*#__PURE__*/React.createElement("div", {
    className: "flex min-h-screen"
  }, /*#__PURE__*/React.createElement("aside", {
    className: "w-60 bg-navy text-white flex-shrink-0 flex flex-col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-5 py-5 border-b border-white/10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-xl bg-orange flex items-center justify-center font-display font-extrabold"
  }, "N"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-display font-extrabold leading-tight"
  }, "NetWebMedia"), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-white/50 uppercase tracking-wider"
  }, "Command Center")))), /*#__PURE__*/React.createElement("nav", {
    className: "flex-1 p-3 space-y-1"
  }, nav.map(([id, icon]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => setView(id),
    className: `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${view === id ? 'bg-orange text-white font-semibold' : 'text-white/70 hover:bg-white/5'}`
  }, /*#__PURE__*/React.createElement("span", null, icon), t('nav.' + id)))), /*#__PURE__*/React.createElement("div", {
    className: "p-4 border-t border-white/10 space-y-3"
  }, armed && /*#__PURE__*/React.createElement("div", {
    className: "text-xs bg-green-500/20 text-green-300 rounded-lg px-2 py-1.5 text-center font-semibold"
  }, t('readiness.armed')), /*#__PURE__*/React.createElement("button", {
    onClick: reset,
    className: "w-full text-[11px] text-white/40 hover:text-white/70"
  }, "\u21BA ", t('header.reset')))), /*#__PURE__*/React.createElement("main", {
    className: "flex-1 min-w-0"
  }, /*#__PURE__*/React.createElement("header", {
    className: "bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "font-display text-xl font-extrabold text-navy"
  }, t('app.title')), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400"
  }, t('app.subtitle'))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-right"
  }, dtl > 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "font-display text-2xl font-extrabold text-orange leading-none"
  }, dtl), /*#__PURE__*/React.createElement("div", {
    className: "text-[10px] text-slate-400 uppercase"
  }, t('header.daysToLaunch'))) : /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-bold text-green-600"
  }, t('header.launched'))), /*#__PURE__*/React.createElement("div", {
    className: "inline-flex rounded-lg overflow-hidden border border-slate-200"
  }, ['es', 'en'].map(l => /*#__PURE__*/React.createElement("button", {
    key: l,
    onClick: () => setLang(l),
    className: `px-3 py-1.5 text-sm font-semibold ${lang === l ? 'bg-navy text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`
  }, l.toUpperCase()))))), /*#__PURE__*/React.createElement("div", {
    className: "p-6 max-w-6xl mx-auto"
  }, view === 'readiness' && /*#__PURE__*/React.createElement(ReadinessView, {
    t: t,
    lang: lang,
    sections: sections,
    setSections: setSections,
    armed: armed,
    setArmed: setArmed
  }), view === 'revenue' && /*#__PURE__*/React.createElement(RevenueView, {
    t: t,
    lang: lang,
    deals: deals,
    setDeals: setDeals,
    config: config,
    setConfig: setConfig
  }), view === 'marketing' && /*#__PURE__*/React.createElement(MarketingView, {
    t: t,
    lang: lang,
    calendar: calendar,
    setCalendar: setCalendar
  }), view === 'connections' && /*#__PURE__*/React.createElement(ConnectionsView, {
    t: t,
    lang: lang,
    connections: connections,
    setConnections: setConnections
  }))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
