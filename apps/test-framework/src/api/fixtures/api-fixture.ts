import {test as base} from '@playwright/test';
import { Client } from 'pg';
import { DbManager } from '../../core/db/db-manager';


export type ApiFixture = {
    dbClient: Client,
};
export const workerTest = base.extend<{}, ApiFixture>({
    dbClient: [
        async({}, use) => {
            const client = await DbManager.getInstance()
            use(client);
        },
        {scope: 'worker', auto: true}
    ],
});