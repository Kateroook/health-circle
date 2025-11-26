import dotenv from 'dotenv';
dotenv.config();

export const config = {
  baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
  
  // Існуючий тестовий користувач з повною реєстрацією
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'test.user@example.com',
    password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
  },
  
  // Для тестів, які не вимагають авторизації
  tempUser: {
    email: `temp-user-${Date.now()}@gmail.com`,
    phone: "+380501134567",
    firstName: "Temporary",
    middleName: "Test",
    lastName: "User",
  }
};

// Хелпери
export function extractTokenFromCookies(setCookieHeader: string[], tokenName: string): string {
  if (!setCookieHeader) return '';
  const cookieString = Array.isArray(setCookieHeader) 
    ? setCookieHeader.join(',') 
    : setCookieHeader;
  const cookies = cookieString.split(',');
  const cookie = cookies.find(c => c.trim().startsWith(`${tokenName}=`));
  if (!cookie) return '';
  const match = cookie.match(new RegExp(`${tokenName}=([^;]+)`));
  return match ? match[1] : '';
}

export interface TestContext {
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
}