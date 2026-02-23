import {Client} from 'pg'
export class DbManager {
    private static instance : Client | null;
    private static connectionPromise : Promise<Client> | null;

    static async getInstance(){
        if(this.instance){
            return this.instance;
        } 
        if (!this.connectionPromise){
            const client = new Client({
                host: process.env.POSTGRES_HOST!,
                port: Number(process.env.POSTGRES_PORT!),
                user: process.env.POSTGRES_USER!,
                password: process.env.POSTGRES_PASS!,
                database: process.env.POSTGRES_DB_NAME!,
                ssl: Boolean(process.env.POSTGRES_SSL!),
            });

            this.connectionPromise = client.connect().then(() => {
                this.instance = client;
                return client;
            })
        }

        return this.connectionPromise;

    }
}