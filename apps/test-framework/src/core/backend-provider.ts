// src/core/helpers/backend-provider.ts
import { APIRequestContext, request } from '@playwright/test';
import { Kysely } from 'kysely';
import { ApiClientFactory } from './api/api-client-factory';
import { expect as statusExpect } from './api/helpers/response-checker';
import { UserFactory } from './data/factories/user-factory';
import { DbCleaner } from './db/db-cleaner';
import { DbManager } from './db/db-manager';
import { ConfirmationCodeRepository } from './db/repositories/confirmation-code-repository';
import { ContactRepository } from './db/repositories/contact-repository';
import { GroupRepository } from './db/repositories/group-repository';
import { UserRepository } from './db/repositories/user-repository';
import { Database } from './db/schema';
import { UserEntity } from './types/entites/user-interface';

export class BackendProvider {
  public db: Kysely<Database>;
  public requestContext: APIRequestContext;
  public api: ApiClientFactory;
  public userRepository: UserRepository;
  public confirmationCodeRepository: ConfirmationCodeRepository;
  public groupRepository: GroupRepository;
  public contactRepository: ContactRepository;
  public dbCleaner: DbCleaner;
  private additionalContexts: APIRequestContext[] = [];

  constructor(db: Kysely<Database>, requestContext: APIRequestContext) {
    this.db = db;
    this.requestContext = requestContext;
    this.dbCleaner = new DbCleaner(db);
    this.api = new ApiClientFactory({ request: requestContext, dbCleaner: this.dbCleaner });
    this.userRepository = new UserRepository(db, this.dbCleaner);
    this.confirmationCodeRepository = new ConfirmationCodeRepository(db, this.dbCleaner);
    this.contactRepository = new ContactRepository(db, this.dbCleaner);
    this.groupRepository = new GroupRepository(db, this.dbCleaner);
  }

  /**
   * Static method for creating provider
   * Gets existing request context from playwright or creates new for WDIO
   * We do this, because TS constructor can't be async
   */
  static async init(existingDb?: Kysely<Database>, existingRequest?: APIRequestContext): Promise<BackendProvider> {
    const db = existingDb || (await DbManager.getInstance());
    const requestContext = existingRequest || (await request.newContext());
    return new BackendProvider(db, requestContext);
  }

  async spawnUser(overrides?: Partial<UserEntity>): Promise<UserEntity> {
    let user = UserFactory.createRandomUser(overrides);

    const postUser = await this.api.users.createUser({
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
    });
    statusExpect(postUser.response).toHaveStatus2xx();

    user.id = postUser.data.id;

    const codeRecord = await this.confirmationCodeRepository.getLastUserCode(user.id);
    if (!codeRecord) throw new Error(`Confirmation code not found for user ${user.id}`);

    const setupPassword = await this.api.auth.setupPassword(user.email!, codeRecord.code, {
      newPassword: user.password,
      confirmNewPassword: user.password,
    });
    statusExpect(setupPassword.response).toHaveStatus2xx();

    return user;
  }

  async spawnApi(): Promise<ApiClientFactory> {
    const context = await request.newContext();
    this.additionalContexts.push(context);

    return new ApiClientFactory({
      request: context,
      dbCleaner: this.dbCleaner,
    });
  }

  async cleanup() {
    await this.dbCleaner.cleanup();
  }

  async dispose() {
    await this.requestContext.dispose();
    for (const context of this.additionalContexts) {
      await context.dispose();
    }
  }
}
