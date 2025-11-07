import { Pool, PoolConfig } from 'pg';
import { escapeIdentifier } from 'pg/lib/utils';
import { Stream } from 'stream';

import { SystemLogsParams } from './logging.types';

export class PostgresStream extends Stream.Writable {
  private readonly pool: Pool;
  private readonly tableName: string;

  constructor(options: { connection: PoolConfig; tableName: string }) {
    super();
    this.pool = new Pool(options.connection);
    this.tableName = options.tableName;
    this._write = this._writePgPool;
  }

  private async insert(content: SystemLogsParams) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const table: string = escapeIdentifier(this.tableName) as string;

    const query = {
      text: `INSERT INTO ${table}
        (name, level_code, hostname, msg, pid, time, user_id, status_code, path, func, stack, data, type_code)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13);`,
      values: [
        content.name,
        content.level,
        content.hostname,
        content.msg,
        content.pid,
        content.time,
        content.userId ?? null,
        content.statusCode ?? null,
        content.path ?? null,
        content.src.func,
        content.stack ?? null,
        content.data ?? null,
        content.type ?? 'other',
      ],
    };

    return this.pool.query(query);
  }

  private _writePgPool = (chunk: Buffer, _enc: BufferEncoding, cb: (err?: Error | null) => void) => {
    let content: SystemLogsParams;
    try {
      content = JSON.parse(chunk.toString());
    } catch (e) {
      return cb(new Error(`Invalid JSON in log stream: ${(e as Error).message}`));
    }

    this.insert(content)
      .then(() => cb())
      .catch((err: Error) => {
        console.error('>>> PG log insert error:', err);
        cb(err);
      });
  };

  async close() {
    await this.pool.end();
  }
}
