import { NotFoundException, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { ExternalFilesEntity } from 'src/common/entities/external-files.entity';
import { FileParam } from 'src/common/types/file-param';
import { QueryRunner, Repository } from 'typeorm';
import { ExternalFilesService } from './external-files.service';

jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    promises: {
      ...originalFs.promises,
      readFile: jest.fn(),
      writeFile: jest.fn(),
      unlink: jest.fn(),
    },
  };
});

jest.mock('src/common/helpers/generate-hash.util', () => ({
  generateHash: jest.fn().mockReturnValue('mock-md5-hash'),
}));

describe('ExternalFilesService', () => {
  let service: ExternalFilesService;
  let repository: jest.Mocked<Repository<ExternalFilesEntity>>;
  let configService: jest.Mocked<ConfigService>;

  const MOCK_BASE_PATH = '/tmp/uploads';
  const MOCK_FILE_BUFFER = Buffer.from('test-content');

  const mockFileParam: FileParam = {
    originalname: 'test.png',
    buffer: MOCK_FILE_BUFFER,
    mimetype: 'image/png',
    size: MOCK_FILE_BUFFER.length,
  } as any;

  const mockEntity = {
    id: 'file-123',
    externalId: 'uuid.png',
    fileName: 'test.png',
    mimetype: 'image/png',
    size: 1024,
  } as ExternalFilesEntity;

  const mockQb = {
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.promises.readFile as jest.Mock).mockResolvedValue(MOCK_FILE_BUFFER);
    (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalFilesService,
        {
          provide: getRepositoryToken(ExternalFilesEntity),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQb),
            findOne: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(MOCK_BASE_PATH) },
        },
      ],
    }).compile();

    service = module.get<ExternalFilesService>(ExternalFilesService);
    repository = module.get(getRepositoryToken(ExternalFilesEntity));
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should create directory if it does not exist', async () => {
      jest.resetModules();
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await Test.createTestingModule({
        providers: [
          ExternalFilesService,
          { provide: getRepositoryToken(ExternalFilesEntity), useValue: {} },
          { provide: ConfigService, useValue: { get: () => MOCK_BASE_PATH } },
        ],
      }).compile();

      expect(fs.mkdirSync).toHaveBeenCalledWith(MOCK_BASE_PATH, { recursive: true });
    });
  });

  describe('getOne', () => {
    it('should return entity if found', async () => {
      mockQb.getOne.mockResolvedValue(mockEntity);
      const result = await service.getOne('file-123');
      expect(result).toBe(mockEntity);
    });

    it('should return NotFoundException if not found', async () => {
      mockQb.getOne.mockResolvedValue(null);
      const result = await service.getOne('missing');
      expect(result).toBeInstanceOf(NotFoundException);
    });
  });

  describe('getFile', () => {
    it('should return StreamableFile', async () => {
      repository.findOne.mockResolvedValue(mockEntity);
      const result = await service.getFile('file-123');
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'file-123' } });
      expect(fs.promises.readFile).toHaveBeenCalledWith(path.join(MOCK_BASE_PATH, mockEntity.externalId));
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('should throw NotFoundException if entity missing', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.getFile('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStreamableFile', () => {
    it('should call getFile if id provided', async () => {
      const spy = jest.spyOn(service, 'getFile').mockResolvedValue('STREAM' as any);
      const result = await service.getStreamableFile({ id: '123' });
      expect(spy).toHaveBeenCalledWith('123');
      expect(result).toBe('STREAM');
    });

    it('should return stream if externalId provided', async () => {
      const result = await service.getStreamableFile({ externalId: 'ext.png', fileName: 'a.png' });
      expect(fs.promises.readFile).toHaveBeenCalled();
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('should throw NotFoundException if no identifiers provided', async () => {
      await expect(service.getStreamableFile({})).rejects.toThrow(NotFoundException);
    });
  });

  describe('upload', () => {
    it('should write file and save to repo', async () => {
      repository.save.mockResolvedValue(mockEntity);
      const result = await service.upload(mockFileParam);

      expect(fs.promises.writeFile).toHaveBeenCalledWith(expect.stringContaining(MOCK_BASE_PATH), MOCK_FILE_BUFFER);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'test.png',
          mimetype: 'image/png',
          size: MOCK_FILE_BUFFER.length,
          md5: 'mock-md5-hash',
        }),
      );
      expect(result).toBe(mockEntity);
    });

    it('should delete file if db save fails', async () => {
      const error = new Error('DB Error');
      repository.save.mockRejectedValue(error);
      await expect(service.upload(mockFileParam)).rejects.toThrow(error);
      expect(fs.promises.unlink).toHaveBeenCalled();
    });

    it('should use QueryRunner if provided', async () => {
      const mockQr = { manager: { getRepository: jest.fn().mockReturnValue(repository) } } as unknown as QueryRunner;
      await service.upload(mockFileParam, mockQr);
      expect(mockQr.manager.getRepository).toHaveBeenCalledWith(ExternalFilesEntity);
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('replaceFile', () => {
    it('should upload new and delete old', async () => {
      const spyUpload = jest.spyOn(service, 'upload').mockResolvedValue(mockEntity);
      const spyDelete = jest.spyOn(service, 'delete').mockResolvedValue({} as any);
      await service.replaceFile('old-id', mockFileParam);
      expect(spyUpload).toHaveBeenCalledWith(mockFileParam, undefined);
      expect(spyDelete).toHaveBeenCalledWith('old-id', undefined);
    });

    it('should ignore errors during deletion of old file', async () => {
      jest.spyOn(service, 'upload').mockResolvedValue(mockEntity);
      jest.spyOn(service, 'delete').mockRejectedValue(new Error('Delete failed'));
      await expect(service.replaceFile('old-id', mockFileParam)).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('should soft delete if found', async () => {
      repository.findOne.mockResolvedValue(mockEntity);
      await service.delete('file-123');
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'file-123' } });
      expect(repository.softDelete).toHaveBeenCalledWith('file-123');
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.delete('x')).rejects.toThrow(NotFoundException);
    });

    it('should use QueryRunner if provided', async () => {
      const mockQr = { manager: { getRepository: jest.fn().mockReturnValue(repository) } } as unknown as QueryRunner;
      repository.findOne.mockResolvedValue(mockEntity);
      await service.delete('file-123', mockQr);
      expect(mockQr.manager.getRepository).toHaveBeenCalledWith(ExternalFilesEntity);
      expect(repository.softDelete).toHaveBeenCalled();
    });
  });
});
