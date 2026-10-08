import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('JWT_SECRET is not set');
    return res.status(500).json({ error: 'JWT_SECRET is not configured' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);

    if (!payload.sub) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    req.user = {
      id: Number(payload.sub),
      role: payload.role,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
};