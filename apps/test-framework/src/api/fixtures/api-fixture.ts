import {APIRequestContext, test as base} from '@playwright/test';
import { Client } from 'pg';
import { DbManager } from '../../core/db/db-manager';
import { UserRepository } from '../../core/db/repositories/user-repository';
import { GroupRepository } from '../../core/db/repositories/group-repository';
import { ContactRepository } from '../../core/db/repositories/contact-repository';
import { ConfirmationCodeRepository } from '../../core/db/repositories/confirmation-code-repository';
import { DbCleaner } from '../../core/db/db-cleaner';
import { ApiClientFactory } from '../../core/api/api-client-factory';


export type ApiFixture = {
    dbClient: Client,
};
export const workerTest = base.extend<{}, ApiFixture>({
    dbClient: [
        async({}, use) => {
            const client = await DbManager.getInstance()
            await use(client);
            await client.end();
        },
        {scope: 'worker', auto: true}
    ],
});

export type MyFixture = {
    userRepository: UserRepository;
    groupRepository: GroupRepository;
    contactRepository: ContactRepository;
    confirmationCodeRepository: ConfirmationCodeRepository;
    dbCleaner: DbCleaner;
    api: ApiClientFactory;
    spawnApi: Promise<ApiClientFactory>;
}

export const test = workerTest.extend<MyFixture>({
    dbCleaner: async({dbClient}, use) => {
        const dbCleaner = new DbCleaner(dbClient);
        await use(dbCleaner);
        await dbCleaner.cleanup();
    },
    userRepository: async({dbClient, dbCleaner}, use) => {
        await use(new UserRepository(dbClient, dbCleaner));
    },
    groupRepository: async({dbClient, dbCleaner}, use) => {
        await use(new GroupRepository(dbClient, dbCleaner));
    },
    contactRepository: async({dbClient, dbCleaner}, use) => {
        await use(new ContactRepository(dbClient, dbCleaner));
    },
    confirmationCodeRepository: async({dbClient, dbCleaner}, use) => {
        await use(new ConfirmationCodeRepository(dbClient, dbCleaner));
    },

    api: async({dbCleaner, request}, use) => {
        const api = new ApiClientFactory({
            request: request,
            dbCleaner: dbCleaner,
        })
        await use(api);
    },

    spawnApi: async({playwright, dbCleaner}, use) => {
        const contexts : APIRequestContext[] = [];
        
        const spawn = async () => {
            const context = await playwright.request.newContext();
            contexts.push(context);

            return new ApiClientFactory({
                request: context,
                dbCleaner: dbCleaner,
            });
        }

        await use(spawn());

        for(const context of contexts) {
            await context.dispose();
        }
    },
});