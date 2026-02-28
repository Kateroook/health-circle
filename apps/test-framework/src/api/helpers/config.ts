import * as dotenv from 'dotenv'
dotenv.config();
export const config = {
  baseApiUrl: process.env.API_BASE_URL!,

  testUser: {
    email: process.env.TEST_USER_EMAIL || "nazaryagotin+3@gmail.com",
    password: process.env.TEST_USER_PASSWORD || "wsXcde321234",
  },

  tempUser: {
    email: `temp-user-${Date.now()}@gmail.com`,
    phone: "+380501134567",
    firstName: "Temporary",
    middleName: "Test",
    lastName: "User",
  },
};