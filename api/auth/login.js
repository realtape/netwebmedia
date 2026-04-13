module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'POST') {
    const { email, password } = req.body || {};
    // Demo auth — replace with real auth in production
    if (email === 'admin@netwebmedia.com' && password === 'admin123') {
      return res.json({
        token: 'demo_token_' + Date.now(),
        user: { email, name: 'Admin', role: 'owner' },
      });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
