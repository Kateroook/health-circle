import { APIRequestContext } from '@playwright/test';
import { TestContext, createTestContext } from './helpers/test-context';
import { AuthClient } from './clients/auth-client';
import { UserClient } from './clients/user-client';
import { GroupClient } from './clients/group-client';
import { ContactClient } from './clients/contact-client';

/**
 * ApiClientFactory - фабрика для створення API клієнтів
 * Забезпечує ізольований TestContext для кожного екземпляра фабрики
 */
export class ApiClientFactory {
  private request: APIRequestContext;
  private context: TestContext;

  /**
   * Створює нову фабрику з ізольованим контекстом
   * @param request - Playwright APIRequestContext
   * @param context - Опціональний TestContext (якщо не вказано, створюється новий)
   */
  constructor(request: APIRequestContext, context?: TestContext) {
    this.request = request;
    // ВАЖЛИВО: Завжди створюємо новий контекст або клонуємо переданий
    this.context = context ? { ...context } : createTestContext();
  }

  /**
   * Отримати AuthClient
   */
  public auth(): AuthClient {
    return new AuthClient(this.request, this.context);
  }

  /**
   * Отримати UserClient
   */
  public users(): UserClient {
    return new UserClient(this.request, this.context);
  }

  /**
   * Отримати GroupClient
   */
  public groups(): GroupClient {
    return new GroupClient(this.request, this.context);
  }

  /**
   * Отримати ContactClient
   */
  public contacts(): ContactClient {
    return new ContactClient(this.request, this.context);
  }

  /**
   * Отримати поточний TestContext
   */
  public getContext(): TestContext {
    return this.context;
  }

  /**
   * Встановити новий TestContext
   * УВАГА: Це замінить весь контекст, використовуйте обережно
   */
  public setContext(context: TestContext): void {
    this.context = { ...context };
  }

  /**
   * Очистити TestContext (створити новий порожній)
   */
  public clearContext(): void {
    this.context = createTestContext();
  }

  /**
   * Клонувати фабрику з новим ізольованим контекстом
   * Корисно для тестування з декількома користувачами
   */
  public clone(): ApiClientFactory {
    return new ApiClientFactory(this.request);
  }

  /**
   * Клонувати фабрику зі скопійованим поточним контекстом
   * Корисно коли потрібно зберегти частину стану (наприклад, токени)
   */
  public cloneWithContext(): ApiClientFactory {
    return new ApiClientFactory(this.request, { ...this.context });
  }
}

/**
 * Створює фабрику API клієнтів з ізольованим контекстом
 * 
 * @example
 * // Створення окремих клієнтів для різних користувачів
 * const user1Api = createApiClients(request);
 * const user2Api = createApiClients(request);
 * 
 * await user1Api.auth().login({ email: 'user1@test.com', password: 'pass' });
 * await user2Api.auth().login({ email: 'user2@test.com', password: 'pass' });
 * 
 * // Контексти ізольовані - токени не перетинаються
 */
export function createApiClients(
  request: APIRequestContext,
  context?: TestContext
): ApiClientFactory {
  return new ApiClientFactory(request, context);
}