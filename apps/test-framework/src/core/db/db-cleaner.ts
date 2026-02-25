import { Client } from "pg";

export interface CleanupTask{
    table: string;
    id: string | number;
}

export class DbCleaner{

    private readonly dbClient : Client;
    private tasks : CleanupTask[] = []

    constructor(dbClient : Client){
        this.dbClient = dbClient;
    }

    /**
   * Додати сутність у чергу на видалення
   */
  add(table: string, id: string | number) {
    this.tasks.push({ table, id });
  }

  /**
   * Очистити все зафіксоване (викликається в afterEach)
   */
  async cleanup() {
    // Видаляємо у зворотному порядку (LIFO), 
    // щоб спочатку йшли залежні сутності, створені останніми
    for (let i = this.tasks.length - 1; i >= 0; i--) {
      const task = this.tasks[i];
      try {
        const query = `DELETE FROM "${task.table}" WHERE id = $1`;
        await this.dbClient.query(query, [task.id]);
      } 
      catch (error : any) {
        console.warn(`[Cleanup] Failed to delete from ${task.table} (ID: ${task.id}):`, error.message);
      }
    }
    
    this.tasks = []; // Очищуємо список після завершення
  }

};