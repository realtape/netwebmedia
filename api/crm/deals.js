const { store, generateId } = require('./_store');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { id, status, stage } = req.query;

  if (req.method === 'GET') {
    if (id) {
      const deal = store.deals.find(d => d.id === id);
      return deal ? res.json(deal) : res.status(404).json({ error: 'Not found' });
    }
    let results = store.deals;
    if (status) results = results.filter(d => d.status === status);
    if (stage) results = results.filter(d => d.stageId === stage);
    return res.json(results);
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (!body.name) return res.status(400).json({ error: 'name required' });
    const deal = {
      id: generateId('deal'),
      name: body.name,
      status: body.status || 'open',
      value: body.value || 0,
      expectedCloseDate: body.expectedCloseDate || '',
      companyId: body.companyId || null,
      primaryContactId: body.primaryContactId || null,
      pipelineId: body.pipelineId || 'pipe_1',
      stageId: body.stageId || 'stage_1',
      owner: body.owner || 'admin',
      description: body.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.deals.push(deal);
    store.activities.unshift({
      id: generateId('act'),
      kind: 'system',
      summary: `New deal: ${deal.name} ($${deal.value.toLocaleString()})`,
      occurredAt: new Date().toISOString(),
      dealId: deal.id,
      companyId: deal.companyId,
      actor: 'admin',
    });
    return res.status(201).json(deal);
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'id query param required' });
    const idx = store.deals.findIndex(d => d.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    store.deals[idx] = { ...store.deals[idx], ...req.body, id, updatedAt: new Date().toISOString() };
    return res.json(store.deals[idx]);
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'id query param required' });
    store.deals = store.deals.filter(d => d.id !== id);
    return res.status(204).end();
  }

  res.status(405).json({ error: 'Method not allowed' });
};
