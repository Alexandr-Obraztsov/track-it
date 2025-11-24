import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: {
    userId: number;
    telegramId: number;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('🔐 [AUTH] Authenticate token middleware called:', {
    method: req.method,
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    hasAuthHeader: !!req.headers['authorization'],
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
  });

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ [AUTH] No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      console.log('❌ [AUTH] Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.log('✅ [AUTH] Token verified successfully:', { userId: (user as any)?.userId });
    req.user = user as { userId: number; telegramId: number };
    next();
  });
};
