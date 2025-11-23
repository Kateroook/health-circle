import { BinaryToTextEncoding, createHash } from 'crypto';

export const generateHash = (text: string | Buffer, algorithm = 'md5', digest: BinaryToTextEncoding = 'hex') =>
  createHash(algorithm).update(text).digest(digest);
