export const ROUTES = {
  LOGIN: '/',
  GROUPS: '/groups',
  BOARD: '/board',
  PROFILE: '/profile',
} as const;

export const getBoardRoute = (chatId: number | string) => `${ROUTES.BOARD}/${chatId}`;

