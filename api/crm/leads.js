const { store, generateId } = require('./_store');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { id, search, status, stage } = req.query;

  if (req.method === 'GET') {
    if (id) {
      const lead = store.leads.find(l => l.id === id);
      return lead ? res.json(lead) : res.status(404).json({ error: 'Not found' });
    }
    let results = store.leads;
    if (status) results = results.filter(l => l.status === status);
    if (stage) results = results.filter(l => l.stageId === stage);
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(l =>
        l.title.toLowerCase().includes(q) ||
        (l.source && l.source.toLowerCase().includes(q))
      );
    }
    return res.json(results);
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (!body.title) return res.status(400).json({ error: 'title required' });
    const lead = {
      id: generateId('lead'),
      title: body.title,
      status: body.status || 'open',
      source: body.source || '',
      score: body.score || 0,
      estimatedValue: body.estimatedValue || 0,
      companyId: body.companyId || null,
      contactId: body.contactId || null,
      pipelineId: body.pipelineId || 'pipe_2',
      stageId: body.stageId || 'stage_6',
      owner: body.owner || 'admin',
      description: body.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.leads.push(lead);
    store.activities.unshift({
      id: generateId('act'),
      kind: 'system',
      summary: `New lead: ${lead.title}`,
      occurredAt: new Date().toISOString(),
      leadId: lead.id,
      companyId: lead.companyId,
      actor: 'admin',
    });
    return res.status(201).json(lead);
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'id query param required' });
    const idx = store.leads.findIndex(l => l.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const oldStage = store.leads[idx].stageId;
    store.leads[idx] = { ...store.leads[idx], ...req.body, id, updatedAt: new Date().toISOString() };
    if (req.body.stageId && req.body.stageId !== oldStage) {
      store.activities.unshift({
        id: generateId('act'),
        kind: 'status_change',
        summary: `Lead stage changed: ${store.leads[idx].title}`,
        occurredAt: new Date().toISOString(),
        leadId: id,
        actor: 'admin',
      });
    }
    return res.json(store.leads[idx]);
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'id query param required' });
    store.leads = store.leads.filter(l => l.id !== id);
    return res.status(204).end();
  }

  res.status(405).json({ error: 'Method not allowed' });
};
