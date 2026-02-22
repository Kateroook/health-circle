import { expect, test } from "@playwright/test";
import { LoginResponse } from "../../core/types/api-types";
import { login } from "../../utils/api-helper";
import { config } from "../helpers/config";

test.describe("Groups API Tests", () => {
  let accessToken: string;
  let groupId: string;
  let inviteCode: string;

  test.beforeEach(async ({ request }) => {
    // Логінимось для отримання токена
    const response = await login({ request: request });

    const loginBody: LoginResponse = await response.json();
    if (loginBody && loginBody.accessToken) {
      accessToken = loginBody.accessToken;
    }
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: видаляємо створене коло
    if (groupId && accessToken) {
      await request.delete(`${config.baseApiUrl}/api/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
  });

  test("Створення нового кола", async ({ request }) => {
    const response = await request.post(`${config.baseApiUrl}/api/groups`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        name: `Тестове коло ${Date.now()}`,
      },
    });

    expect(response.status()).toBe(201);
    const group = await response.json();
    groupId = group.id;
    inviteCode = group.inviteCode;

    expect(group).toHaveProperty("id");
    expect(group).toHaveProperty("name");
    expect(group).toHaveProperty("inviteCode");
  });

  test("Отримання всіх кіл користувача", async ({ request }) => {
    const response = await request.get(`${config.baseApiUrl}/api/groups`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const groups = await response.json();

    expect(Array.isArray(groups)).toBeTruthy();
  });

  test("Отримання кола за ID", async ({ request }) => {
    test.skip(!groupId, "Коло не створено");

    const response = await request.get(
      `${config.baseApiUrl}/api/groups/${groupId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    expect(response.status()).toBe(200);
    const group = await response.json();

    expect(group.id).toBe(groupId);
    expect(group).toHaveProperty("name");
    expect(group).toHaveProperty("owner");
    expect(group).toHaveProperty("members");
  });

  test("Оновлення назви кола", async ({ request }) => {
    test.skip(!groupId, "Коло не створено");

    const newName = `Оновлене коло ${Date.now()}`;
    const response = await request.put(`${config.baseApiUrl}/api/groups`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        id: groupId,
        name: newName,
        members: [],
      },
    });

    expect(response.status()).toBe(200);
    const group = await response.json();

    expect(group.id).toBe(groupId);
    expect(group.name).toBe(newName);
  });

  test("Регенерація invite коду", async ({ request }) => {
    test.skip(!groupId, "Коло не створено");

    const response = await request.post(
      `${config.baseApiUrl}/api/groups/${groupId}/invite`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    expect(response.status()).toBe(201);
    const result = await response.json();

    expect(result).toHaveProperty("inviteCode");
    expect(result.inviteCode).not.toBe(inviteCode);
  });

  test("Приєднання до кола з невалідним кодом", async ({ request }) => {
    const response = await request.post(`${config.baseApiUrl}/api/groups/join`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        code: "invalid-code-xyz-123",
      },
    });

    expect(response.status()).toBe(404);
  });

  test("Отримання кола без авторизації", async ({ request }) => {
    test.skip(!groupId, "Коло не створено");

    const response = await request.get(
      `${config.baseApiUrl}/api/groups/${groupId}`,
    );

    expect(response.status()).toBe(401);
  });

  test("Створення кола без авторизації", async ({ request }) => {
    const response = await request.post(`${config.baseApiUrl}/api/groups`, {
      data: {
        name: "Неавторизоване коло",
      },
    });

    expect(response.status()).toBe(401);
  });

  test("Видалення кола за неіснуючим ID", async ({ request }) => {
    const fakeUUID = "00000000-0000-0000-0000-000000000000";

    const response = await request.delete(
      `${config.baseApiUrl}/api/groups/${fakeUUID}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    expect(response.status()).toBe(400);
  });
});
