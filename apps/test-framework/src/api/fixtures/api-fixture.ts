import {test as base} from '@playwright/test';
import { Client } from 'pg';
import { DbManager } from '../../core/db/db-manager';
import { UserRepository } from '../../core/db/repositories/user-repository';
import { GroupRepository } from '../../core/db/repositories/group-repository';
import { ContactRepository } from '../../core/db/repositories/contact-repository';
import { ConfirmationCodeRepository } from '../../core/db/repositories/confirmation-code-repository';


export type ApiFixture = {
    dbClient: Client,
};
export const workerTest = base.extend<{}, ApiFixture>({
    dbClient: [
        async({}, use) => {
            const client = await DbManager.getInstance()
            use(client);
            // client.end();
        },
        {scope: 'worker', auto: true}
    ],
});

export type MyFixture = {
    userRepository: UserRepository;
    groupRepository: GroupRepository;
    contactRepository: ContactRepository;
    confirmationCodeRepository: ConfirmationCodeRepository;
}

export const test = workerTest.extend<MyFixture>({
    userRepository: async({dbClient}, use) => {
        use(new UserRepository(dbClient));
    },
    groupRepository: async({dbClient}, use) => {
        use(new GroupRepository(dbClient));
    },
    contactRepository: async({dbClient}, use) => {
        use(new ContactRepository(dbClient));
    },
    confirmationCodeRepository: async({dbClient}, use) => {
        use(new ConfirmationCodeRepository(dbClient));
    },
});