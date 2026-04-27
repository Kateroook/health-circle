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

  public async getFile(id: string) {
    const externalFile = await this.repository.findOne({ where: { id } });
    if (!externalFile) throw new NotFoundException(`External file with id = ${id} not found`);

    const filePath = path.join(this.basePath, externalFile.externalId);
    if (!fs.existsSync(filePath)) throw new NotFoundException(`File not found on disk`);

    const stream = fs.createReadStream(filePath);
    const sanitizedFileName = externalFile.fileName.replace(/[^a-zA-Z0-9,.\-_ ()]/g, '_');

    return new StreamableFile(stream, {
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
    size?: number;
  }): Promise<StreamableFile> {
    if (file.id) {
      return this.getFile(file.id);
    }
    if (file.externalId) {
      const filePath = path.join(this.basePath, file.externalId);
      if (!fs.existsSync(filePath)) throw new NotFoundException(`File not found on disk`);
      const stream = fs.createReadStream(filePath);
      return new StreamableFile(stream, {
        type: file.mimetype,
        disposition: `inline; filename="${file.fileName}"`,
        length: file.size,
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

  public async cleanup() {
    const dirFiles = await fs.promises.readdir(this.basePath);
    const dbFiles = await this.repository.find({ select: ['id', 'externalId'] });

    const dbExternalIds = new Set(dbFiles.map((f) => f.externalId));
    const dirFilesSet = new Set(dirFiles);

    const onlyInDir = dirFiles.filter((dirFile) => !dbExternalIds.has(dirFile));
    const onlyInDb = dbFiles.filter((dbFile) => !dirFilesSet.has(dbFile.externalId));
    const onlyInDbIds = onlyInDb.map((e) => e.id);

    return { onlyInDir, onlyInDbIds };
  }
}
