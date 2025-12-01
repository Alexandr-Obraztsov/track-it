/**
 * Моки для TypeORM и базы данных
 */

export const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  })),
};

export const mockDataSource = {
  getRepository: jest.fn(() => mockRepository),
  initialize: jest.fn(),
  isInitialized: true,
  destroy: jest.fn(),
};

export const resetMocks = () => {
  Object.values(mockRepository).forEach((fn) => {
    if (typeof fn === 'function' && fn.mockClear) {
      fn.mockClear();
    }
  });
  mockDataSource.getRepository.mockClear();
};

