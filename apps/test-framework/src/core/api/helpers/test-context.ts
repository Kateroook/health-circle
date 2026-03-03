/**
 * TestContext - контекст для зберігання стану
 * Використовується для збереження токенів, userId та іншої інформації між тестами
 */
export interface TestContext {
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  groupId?: string;
  contactId?: string;
  metadata?: Record<string, any>;
}

/**
 * Створює новий TestContext
 */
export function createTestContext(): TestContext {
  return {
    metadata: {},
  };
}

/**
 * Оновлює TestContext з новими даними
 */
export function updateTestContext(context: TestContext, updates: Partial<TestContext>): TestContext {
  return {
    ...context,
    ...updates,
    metadata: {
      ...context.metadata,
      ...updates.metadata,
    },
  };
}

/**
 * Очищує токени з TestContext
 */
export function clearAuthFromContext(context: TestContext): TestContext {
  return {
    ...context,
    accessToken: undefined,
    refreshToken: undefined,
  };
}

/**
 * Перевіряє, чи користувач авторизований
 */
export function isAuthenticated(context: TestContext): boolean {
  return !!context.accessToken;
}
