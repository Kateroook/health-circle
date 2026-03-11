// test-framework/src/utils/api-helper.ts
import { APIRequestContext, APIResponse } from '@playwright/test';
import { config } from '../api/helpers/config';
import { LoginResponse } from '../core/types/api/auth.types';

export async function login({
  request,
  email,
  password,
}: {
  request: APIRequestContext;
  email?: string;
  password?: string;
}): Promise<APIResponse> {
  const res = await request.post(`${config.baseApiUrl}/api/auth/login`, {
    data: {
      email: email ?? config.testUser.email,
      password: password ?? config.testUser.password,
    },
  });

  return res;
}

export async function authWithAccessToken({
  request,
  accessToken,
}: {
  request: APIRequestContext;
  accessToken: string;
}): Promise<APIResponse> {
  const response = await request.get(`${config.baseApiUrl}/api/auth/profile`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response;
}

export async function getAccessToken({
  request,
  email,
  password,
}: {
  request: APIRequestContext;
  email?: string;
  password?: string;
}): Promise<string> {
  const res = await login({ request, email, password });

  const body: LoginResponse = await res.json();
  return body.accessToken!;
}
