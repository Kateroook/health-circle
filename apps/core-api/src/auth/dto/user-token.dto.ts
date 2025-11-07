export class UserTokenDto {
  token: string;
  tokenType: string;
  expiresIn: number;
  jti?: string;
  // Optional scope string (space-delimited)
  scope: string;
  // Expiration/issued timestamps (ISO or epoch depending on your API)
  issuedAt: Date;
  expiresAt: Date;
}
