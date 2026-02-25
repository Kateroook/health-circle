import { DbManager } from '../core/db/db-manager';
import { ConfirmationCodeRepository } from '../core/db/repositories/confirmation-code-repository';
import { UserRepository } from '../core/db/repositories/user-repository';

export async function main() {
    try {
        // console.log("Hello World!");
        const dbClient = await DbManager.getInstance();
        const userRepo = new UserRepository(dbClient);
        const codeRepo = new ConfirmationCodeRepository(dbClient);

        console.log('Fetching users...');
        const users = await userRepo.getAll();
        const code = await codeRepo.findBy({userId: '5a66842d-25df-4ce7-aa38-d8b76fe6c742'})
        
        if (users.length === 0) {
            console.log('No users found in database.');
        } else {
            console.log(users);
        }
        console.log(code);

        await dbClient.end();
    } catch (error) {
        console.error('Failed to run test script:', error);
        process.exit(1);
    }
}

main();