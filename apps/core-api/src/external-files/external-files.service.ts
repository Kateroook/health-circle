import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { generateHash } from 'src/common/helpers/generate-hash.util';
import { FileParam } from 'src/common/types/file-param';
import { QueryRunner, Repository } from 'typeorm';

import { ExternalFilesEntity } from './entities/external-files.entity';

@Injectable()
export class ExternalFilesService {
  private readonly basePath: string;

  constructor(
    @InjectRepository(ExternalFilesEntity)
    private readonly repository: Repository<ExternalFilesEntity>,
    private readonly configService: ConfigService,
  ) {
    this.basePath = configService.get<string>('EXTERNAL_FILES_PATH')!;
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  private getManyQueryBuilder() {
    return this.repository.createQueryBuilder('files');
  }

  private getOneQueryBuilder() {
    return this.repository.createQueryBuilder('files');
  }

  public async getOne(id: string) {
    return (
      (await this.getOneQueryBuilder().where('files.id = :id', { id }).getOne()) ||
      new NotFoundException(`External file with id = ${id} not found`)
    );
  }

  public async getFileByExternalId(externalId: string) {
    const filePath = path.join(this.basePath, externalId);
    return await fs.promises.readFile(filePath);
  }

  public async getFile(id: string) {
    const externalFile = await this.repository.findOne({ where: { id } });
    if (!externalFile) throw new NotFoundException(`External file with id = ${id} not found`);
    const file = await this.getFileByExternalId(externalFile.externalId);

    const sanitizedFileName = externalFile.fileName.replace(/[^a-zA-Z0-9,.\-_ ()]/g, '_');
    return new StreamableFile(Buffer.from(file.buffer), {
      type: externalFile.mimetype,
      disposition: `attachment; filename="${sanitizedFileName}"`,
      length: externalFile.size,
    });
  }

  async getStreamableFile(file: {
    id?: string;
    externalId?: string;
    fileName?: string;
    mimetype?: string;
  }): Promise<StreamableFile> {
    if (file.id) {
      return this.getFile(file.id);
    }
    if (file.externalId) {
      const buffer = await this.getFileByExternalId(file.externalId);
      return new StreamableFile(buffer, {
        type: file.mimetype,
        disposition: `inline; filename="${file.fileName}"`,
        length: buffer.length,
      });
    }
    throw new NotFoundException('File not found');
  }

  public async upload(file: FileParam, queryRunner?: QueryRunner): Promise<ExternalFilesEntity> {
    const [_name, extension] = file.originalname.split(/\.(?=[^.]+$)/);
    const externalId = `${randomUUID()}.${extension}`;
    const filePath = path.join(this.basePath, externalId);

    try {
      await fs.promises.writeFile(filePath, file.buffer);
      const repository = queryRunner?.manager.getRepository(ExternalFilesEntity) || this.repository;
      return await repository.save({
        fileName: file.originalname,
        externalId,
        md5: generateHash(file.buffer),
        size: file.buffer.length,
        mimetype: file.mimetype,
      });
    } catch (e) {
      if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
      throw e;
    }
  }

  public async replaceFile(oldFileId: string | null, fileData: FileParam, queryRunner?: QueryRunner) {
    const uploadedFile = await this.upload(fileData, queryRunner);

    if (oldFileId) {
      try {
        await this.delete(oldFileId, queryRunner);
      } catch {
        // ignore
      }
    }

    return uploadedFile;
  }

  public async delete(id: string, queryRunner?: QueryRunner) {
    const repository = queryRunner?.manager.getRepository(ExternalFilesEntity) || this.repository;
    const externalFile = await repository.findOne({ where: { id } });
    if (!externalFile) throw new NotFoundException(`External file with id = ${id} not found`);

    return await repository.softDelete(id);
  }
}
