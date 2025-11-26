import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { SecurityService } from './security.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
  genSalt: jest.fn(),
}));

describe('SecurityService', () => {
  let service: SecurityService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'SERVER_SECRET') return 'test-secret';
        if (key === 'SERVER_SALT') return 'test-salt';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SecurityService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<SecurityService>(SecurityService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hash', () => {
    it('should encrypt data and hash it using bcrypt', async () => {
      const data = 'my-password';
      const mockSalt = 'generated-salt';
      const mockHash = 'bcrypt-hash';

      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const result = await service.hash(data);

      expect(configService.getOrThrow).toHaveBeenCalledWith('SERVER_SECRET');
      expect(configService.getOrThrow).toHaveBeenCalledWith('SERVER_SALT');
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), mockSalt);

      const callArgs = (bcrypt.hash as jest.Mock).mock.calls[0];
      expect(callArgs[0]).not.toBe(data);

      expect(result).toBe(mockHash);
    });
  });

  describe('validate', () => {
    it('should encrypt data and compare it using bcrypt', async () => {
      const data = 'my-password';
      const hash = 'stored-hash';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validate(data, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(expect.any(String), hash);

      const callArgs = (bcrypt.compare as jest.Mock).mock.calls[0];
      expect(callArgs[0]).not.toBe(data);

      expect(result).toBe(true);
    });

    it('should return false if match fails', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await service.validate('wrong', 'hash');
      expect(result).toBe(false);
    });
  });

  describe('getConfirmCode', () => {
    it('should generate numeric code of specified length', () => {
      const length = 6;
      const code = service.getConfirmCode(length);

      expect(code).toHaveLength(length);
      expect(code).toMatch(/^\d+$/);
    });

    it('should generate valid Luhn codes', () => {
      for (let i = 0; i < 20; i++) {
        const code = service.getConfirmCode(6);
        expect(service.validateConfirmCode(code)).toBe(true);
      }
    });
  });

  describe('validateConfirmCode', () => {
    it('should validate correct Luhn numbers', () => {
      expect(service.validateConfirmCode('79927398713')).toBe(true);
      expect(service.validateConfirmCode('12345674')).toBe(true);
    });

    it('should invalidate incorrect numbers', () => {
      expect(service.validateConfirmCode('12345670')).toBe(false);
      expect(service.validateConfirmCode('123456742')).toBe(false);
    });
  });

  describe('generateRandomToken', () => {
    it('should return hex string of correct length', () => {
      const length = 32;
      const token = service.generateRandomToken(length);

      expect(token).toHaveLength(length * 2);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });
});
