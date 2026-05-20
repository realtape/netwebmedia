const { store, generateId } = require('./_store');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    const { limit } = req.query;
    const max = Math.min(parseInt(limit) || 20, 100);
    return res.json(store.activities.slice(0, max));
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (!body.kind || !body.summary) {
      return res.status(400).json({ error: 'kind and summary required' });
    }
    const activity = {
      id: generateId('act'),
      kind: body.kind,
      summary: body.summary,
      details: body.details || '',
      occurredAt: new Date().toISOString(),
      companyId: body.companyId || null,
      contactId: body.contactId || null,
      leadId: body.leadId || null,
      dealId: body.dealId || null,
      actor: body.actor || 'admin',
    };
    store.activities.unshift(activity);
    return res.status(201).json(activity);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
