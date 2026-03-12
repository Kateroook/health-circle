import { expect } from "@playwright/test";
import { assertResponse, checkResponse } from "../../../core/api/helpers/response-checker";
import { test } from "../../fixtures/api-fixture";

test.describe.only("api/auth/login tests", async () => {
    test("Successfull login via email", async ({api, spawnUser}) => {
        const user = await spawnUser();

        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });

        assertResponse.is2xx(login.response);
        expect(api.getContext().accessToken).not.toBeNull();
        expect(api.getContext().accessToken).not.toBeUndefined();
        expect(api.getContext().refreshToken).not.toBeNull();
        expect(api.getContext().refreshToken).not.toBeUndefined();
    });

    test("Successfull login via phone", async ({api, spawnUser}) => {
        const user = await spawnUser();

        const login = await api.auth.login({
            identifier: user.phone,
            password: user.password,
        });

        assertResponse.is2xx(login.response);
        expect(api.getContext().accessToken).not.toBeNull();
        expect(api.getContext().accessToken).not.toBeUndefined();
        expect(api.getContext().refreshToken).not.toBeNull();
        expect(api.getContext().refreshToken).not.toBeUndefined();
    });
});