const { store, generateId } = require('./_store');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { id, status, priority } = req.query;

  if (req.method === 'GET') {
    if (id) {
      const task = store.tasks.find(t => t.id === id);
      return task ? res.json(task) : res.status(404).json({ error: 'Not found' });
    }
    let results = store.tasks;
    if (status) results = results.filter(t => t.status === status);
    if (priority) results = results.filter(t => t.priority === priority);
    return res.json(results);
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (!body.title) return res.status(400).json({ error: 'title required' });
    const task = {
      id: generateId('task'),
      title: body.title,
      description: body.description || '',
      status: body.status || 'todo',
      priority: body.priority || 'medium',
      dueAt: body.dueAt || null,
      assignedTo: body.assignedTo || 'admin',
      companyId: body.companyId || null,
      contactId: body.contactId || null,
      leadId: body.leadId || null,
      dealId: body.dealId || null,
      createdAt: new Date().toISOString(),
    };
    store.tasks.push(task);
    return res.status(201).json(task);
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'id query param required' });
    const idx = store.tasks.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    store.tasks[idx] = { ...store.tasks[idx], ...req.body, id };
    return res.json(store.tasks[idx]);
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'id query param required' });
    store.tasks = store.tasks.filter(t => t.id !== id);
    return res.status(204).end();
  }

  res.status(405).json({ error: 'Method not allowed' });
};
