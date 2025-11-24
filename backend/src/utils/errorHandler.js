export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.type === 'auth') {
    return res.status(401).json({ error: err.message });
  }

  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
};
