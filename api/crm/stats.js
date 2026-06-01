const { store } = require('./_store');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    const openDeals = store.deals.filter(d => d.status === 'open');
    const totalPipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const openLeads = store.leads.filter(l => l.status === 'open' || l.status === 'qualified');
    const totalLeadValue = openLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

    const tasksDue = store.tasks.filter(t => {
      if (t.status === 'done') return false;
      if (!t.dueAt) return false;
      return new Date(t.dueAt) <= new Date(Date.now() + 7 * 86400000);
    });

    const contactsByStage = {};
    store.contacts.forEach(c => {
      contactsByStage[c.lifecycleStage] = (contactsByStage[c.lifecycleStage] || 0) + 1;
    });

    const dealsByStage = {};
    const pipeline = store.pipelines.find(p => p.entityType === 'deal');
    if (pipeline) {
      pipeline.stages.forEach(s => {
        dealsByStage[s.name] = store.deals.filter(d => d.stageId === s.id && d.status === 'open').length;
      });
    }

    return res.json({
      totalContacts: store.contacts.length,
      totalCompanies: store.companies.length,
      openLeads: openLeads.length,
      totalLeadValue,
      openDeals: openDeals.length,
      totalPipelineValue,
      tasksDueThisWeek: tasksDue.length,
      tasksOverdue: store.tasks.filter(t => t.status !== 'done' && t.dueAt && new Date(t.dueAt) < new Date()).length,
      contactsByStage,
      dealsByStage,
      recentActivities: store.activities.slice(0, 5),
    });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
