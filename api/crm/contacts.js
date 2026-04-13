const { store, generateId } = require('./_store');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { id, search } = req.query;

  if (req.method === 'GET') {
    if (id) {
      const contact = store.contacts.find(c => c.id === id);
      return contact ? res.json(contact) : res.status(404).json({ error: 'Not found' });
    }
    let results = store.contacts;
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(c =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.jobTitle && c.jobTitle.toLowerCase().includes(q))
      );
    }
    return res.json(results);
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (!body.firstName || !body.email) {
      return res.status(400).json({ error: 'firstName and email required' });
    }
    const contact = {
      id: generateId('cont'),
      firstName: body.firstName,
      lastName: body.lastName || '',
      email: body.email,
      phone: body.phone || '',
      jobTitle: body.jobTitle || '',
      lifecycleStage: body.lifecycleStage || 'lead',
      companyId: body.companyId || null,
      owner: body.owner || 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.contacts.push(contact);
    store.activities.unshift({
      id: generateId('act'),
      kind: 'system',
      summary: `New contact: ${contact.firstName} ${contact.lastName}`,
      details: `Added ${contact.email}`,
      occurredAt: new Date().toISOString(),
      contactId: contact.id,
      actor: 'admin',
    });
    return res.status(201).json(contact);
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'id query param required' });
    const idx = store.contacts.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    store.contacts[idx] = { ...store.contacts[idx], ...req.body, id, updatedAt: new Date().toISOString() };
    return res.json(store.contacts[idx]);
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'id query param required' });
    store.contacts = store.contacts.filter(c => c.id !== id);
    return res.status(204).end();
  }

  res.status(405).json({ error: 'Method not allowed' });
};
