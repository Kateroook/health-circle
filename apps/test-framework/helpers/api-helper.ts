import { APIRequestContext } from "@playwright/test";
import { config } from "../config";
import { LoginResponse } from "../types/api-types";

export async function login(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${config.baseURL}/api/auth/login`, {
    data: {
      email: config.testUser.email,
      password: config.testUser.password,
    }
  });

  const body: LoginResponse = await res.json();
  return body.accessToken;
}