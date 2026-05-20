// This Node.js stub is not deployed. Production auth is at api-php/routes/auth.php
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  return res.status(501).json({ error: 'This endpoint is not active. Use /api/auth instead.' });
};
