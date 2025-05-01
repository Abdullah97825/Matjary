require('@testing-library/jest-dom');

// Mock Next.js router
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
}); 