export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    issuedAt: Date;
    expiresAt: Date;
}