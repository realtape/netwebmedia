const { store, generateId } = require('./_store');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { id, search } = req.query;

  if (req.method === 'GET') {
    if (id) {
      const company = store.companies.find(c => c.id === id);
      if (!company) return res.status(404).json({ error: 'Not found' });
      const contacts = store.contacts.filter(c => c.companyId === id);
      const deals = store.deals.filter(d => d.companyId === id);
      const leads = store.leads.filter(l => l.companyId === id);
      return res.json({ ...company, contacts, deals, leads });
    }
    let results = store.companies;
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.industry && c.industry.toLowerCase().includes(q))
      );
    }
    return res.json(results);
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (!body.name) return res.status(400).json({ error: 'name required' });
    const company = {
      id: generateId('comp'),
      name: body.name,
      website: body.website || '',
      industry: body.industry || '',
      companySize: body.companySize || '',
      status: body.status || 'prospect',
      owner: body.owner || 'admin',
      metadata: body.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.companies.push(company);
    return res.status(201).json(company);
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'id query param required' });
    const idx = store.companies.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    store.companies[idx] = { ...store.companies[idx], ...req.body, id, updatedAt: new Date().toISOString() };
    return res.json(store.companies[idx]);
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'id query param required' });
    store.companies = store.companies.filter(c => c.id !== id);
    return res.status(204).end();
  }

  res.status(405).json({ error: 'Method not allowed' });
};
