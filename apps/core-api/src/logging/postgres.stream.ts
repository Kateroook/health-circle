import { escapeIdentifier, Pool, PoolConfig } from 'pg';
import { Stream } from 'stream';

import { SystemLogsParams } from './logging.types';

export class PostgresStream extends Stream.Writable {
  private readonly pool: Pool;
  private readonly tableName: string;

  constructor(options: { connection: PoolConfig; tableName: string }) {
    super();
    this.pool = new Pool(options.connection);
    this.tableName = options.tableName;
    this._write = (chunk: unknown, enc: BufferEncoding, cb: (error?: Error | null) => void) =>
      this._writePgPool(chunk as Buffer, enc, cb);
  }

  private async insert(content: SystemLogsParams) {
    const table: string = escapeIdentifier(this.tableName);
    const query = {
      text: `INSERT INTO ${table}
        (name, level_code, hostname, msg, pid, time, user_id, status_code, path, func, stack, data, type_code)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13);`,
      values: [
        content.name,
        content.level,
        content.hostname,
        content.msg || '',
        content.pid,
        new Date(content.time), // Convert epoch or ISO string to Date
        content.userId ?? null,
        content.statusCode ?? null,
        content.path ?? null,
        content.src?.func ?? null, // Safely access func
        content.stack ?? null,
        content.data ?? null,
        content.type ?? 'other',
      ],
    };

    try {
      await this.pool.query(query);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn('PostgresStream insert failed, skipping log:', errorMessage);
    }
  }

  private _writePgPool(chunk: Buffer, _enc: BufferEncoding, cb: (err?: Error | null) => void) {
    let content: SystemLogsParams;
    try {
      content = JSON.parse(chunk.toString()) as SystemLogsParams;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('PostgresStream invalid JSON, skipping log:', message);
      return process.nextTick(() => cb());
    }
    void this.insert(content).finally(() => cb());
  }

  async close() {
    await this.pool.end();
  }
}
