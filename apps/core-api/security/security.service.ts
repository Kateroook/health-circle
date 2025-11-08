import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, genSalt, hash } from 'bcrypt';
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

@Injectable()
export class SecurityService {
  constructor(private readonly configService: ConfigService) {}

  private async encrypt(data: string): Promise<string> {
    const secret = this.configService.getOrThrow<string>('SERVER_SECRET');
    const salt = this.configService.getOrThrow<string>('SERVER_SALT');
    return ((await promisify(scrypt)(data, `${secret + salt}`, 32)) as Buffer).toString('base64');
  }

  async hash(data: string): Promise<string> {
    return hash(await this.encrypt(data), await genSalt());
  }

  async validate(data: string, hash: string): Promise<boolean> {
    return compare(await this.encrypt(data), hash);
  }

  getConfirmCode(codeLength = 6): string {
    let code = '';
    for (let i = 0; i < codeLength - 1; i++) {
      code += SecurityService.getRandomIntInclusive(0, 9);
    }
    return code + this.luhnCalculate(code).toString();
  }

  validateConfirmCode(code: string) {
    return SecurityService.luhnChecksum(code) == 0;
  }

  private static getRandomIntInclusive(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return (Math.floor(Math.random() * (max - min + 1)) + min).toString();
  }

  private static luhnChecksum(code: string) {
    const len = code.length;
    const parity = len % 2;
    let sum = 0;
    for (let i = len - 1; i >= 0; i--) {
      let d = parseInt(code.charAt(i));
      if (i % 2 == parity) d *= 2;
      if (d > 9) d -= 9;
      sum += d;
    }
    return sum % 10;
  }

  private luhnCalculate(code: string) {
    const checksum = SecurityService.luhnChecksum(code + '0');
    return checksum == 0 ? 0 : 10 - checksum;
  }

  generateRandomToken(length = 32): string {
    return randomBytes(length).toString('hex');
  }
}
