//test-framework/src/api/helpers/config.ts
import * as dotenv from 'dotenv'
dotenv.config();
export const config = {
  baseApiUrl: process.env.API_BASE_URL!,

  // Існуючий тестовий користувач з повною реєстрацією
  testUser: {
    email: process.env.TEST_USER_EMAIL || "nazaryagotin+3@gmail.com",
    password: process.env.TEST_USER_PASSWORD || "wsXcde321234",
  },

  // Для тестів, які не вимагають авторизаціїWW
  tempUser: {
    email: `temp-user-${Date.now()}@gmail.com`,
    phone: "+380501134567",
    firstName: "Temporary",
    middleName: "Test",
    lastName: "User",
  },
};

// Хелпери
export function extractTokenFromCookies(
  setCookieHeader: string[],
  tokenName: string,
): string {
  if (!setCookieHeader) return "";
  const cookieString = Array.isArray(setCookieHeader)
    ? setCookieHeader.join(",")
    : setCookieHeader;
  const cookies = cookieString.split(",");
  const cookie = cookies.find((c) => c.trim().startsWith(`${tokenName}=`));
  if (!cookie) return "";
  const match = cookie.match(new RegExp(`${tokenName}=([^;]+)`));
  return match ? match[1] : "";
}
