import { Database } from "./schema";
import { Kysely } from "kysely";

export interface CleanupTask{
    table: keyof Database;
    id: string | number;
}

export class DbCleaner{

    private readonly db : Kysely<Database>;
    private tasks : CleanupTask[] = []

    constructor(db : Kysely<Database>){
        this.db = db;
    }

    /**
   * Додати сутність у чергу на видалення
   */
  add(table: keyof Database, id: string | number) {
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
        await this.db
          .deleteFrom(task.table)
          .where('id' as any, '=', task.id)
          .execute();
      } 
      catch (error : any) {
        console.warn(`[Cleanup] Failed to delete from ${task.table} (ID: ${task.id}):`, error.message);
      }
    }
    
    this.tasks = []; // Очищуємо список після завершення
  }
};