/**
 * Моки для middleware
 */

export const mockAuthenticateToken = (req: any, res: any, next: any) => {
  req.user = { userId: 1, telegramId: 123456 };
  next();
};

export const mockAuthenticateTokenWithUser = (userId: number, telegramId: number) => {
  return (req: any, res: any, next: any) => {
    req.user = { userId, telegramId };
    next();
  };
};

export const mockAuthenticateTokenFail = (req: any, res: any) => {
  res.status(401).json({ error: 'Unauthorized' });
};

