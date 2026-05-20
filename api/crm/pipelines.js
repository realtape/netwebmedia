const { store } = require('./_store');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    const { id } = req.query;
    if (id) {
      const pipeline = store.pipelines.find(p => p.id === id);
      return pipeline ? res.json(pipeline) : res.status(404).json({ error: 'Not found' });
    }
    return res.json(store.pipelines);
  }

  res.status(405).json({ error: 'Method not allowed' });
};
