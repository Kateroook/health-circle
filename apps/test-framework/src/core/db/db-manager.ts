import {Client} from 'pg'
import * as dotenv from 'dotenv'
import path from 'path';
import { fileURLToPath } from 'url';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const envPath = path.resolve(__dirname, '../../../.env');
// dotenv.config({ path: envPath});
dotenv.config();
export class DbManager {
    private static instance : Client | null;
    private static connectionPromise : Promise<Client> | null;

    static async getInstance(){
        if(this.instance){
            return this.instance;
        } 
        if (!this.connectionPromise){
            const client = new Client({
                host: process.env.HEALTHCIRCLE_POSTGRES_HOST!,
                port: Number(process.env.HEALTHCIRCLE_POSTGRES_PORT!),
                user: process.env.HEALTHCIRCLE_POSTGRES_USER!,
                password: process.env.HEALTHCIRCLE_POSTGRES_PASS!,
                database: process.env.HEALTHCIRCLE_POSTGRES_DB_NAME!,
                ssl: Boolean(process.env.HEALTHCIRCLE_POSTGRES_SSL!),
            });

            this.connectionPromise = client.connect().then(() => {
                this.instance = client;
                return client;
            })
        }

        return this.connectionPromise;

    }
}
