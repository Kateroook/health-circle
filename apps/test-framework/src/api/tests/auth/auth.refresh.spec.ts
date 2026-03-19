import { expect, test } from "../../fixtures/api-fixture";
test.describe('api/auth/refresh tests', async () => {
    test('[AUTH-011] Valid token refresh', async ({ api, spawnUser }) => {
        const user = await spawnUser();
        
        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(login.response).toHaveStatus2xx();

        const oldContext = {...api.getContext()};
        const refresh = await api.auth.refreshToken();

        expect(refresh.response).toHaveStatus2xx();
        expect(api.getContext().accessToken).not.toEqual(oldContext.accessToken);
        expect(api.getContext().refreshToken).not.toEqual(oldContext.refreshToken);
    });

    test('[AUTH-012] Refresh with access token instead of refresh token', async ({ api, spawnUser }) => {
        const user = await spawnUser();
        
        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(login.response).toHaveStatus2xx();

        const oldContext = {...api.getContext()};
        const refresh = await api.auth.refreshToken({customToken: api.getContext().accessToken});

        expect(refresh.response).toHaveStatus(401);
        expect(api.getContext().accessToken).toEqual(oldContext.accessToken);
        expect(api.getContext().refreshToken).toEqual(oldContext.refreshToken);
    });

    test('[AUTH-013] Refresh without token', async ({ api, spawnUser }) => {
        const user = await spawnUser();
        
        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(login.response).toHaveStatus2xx();

        const oldContext = {...api.getContext()};
        const refresh = await api.auth.refreshToken({noToken: true});

        expect(refresh.response).toHaveStatus(401);
        expect(api.getContext().accessToken).toEqual(oldContext.accessToken);
        expect(api.getContext().refreshToken).toEqual(oldContext.refreshToken);
    });

    test("[AUTH-014] Old access token doesn't work after refresh", async ({ api, spawnUser }) => {
        const user = await spawnUser();
        
        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(login.response).toHaveStatus2xx();

        const oldApi = api.cloneWithContext();
        const refresh = await api.auth.refreshToken();

        expect(refresh.response).toHaveStatus2xx();
        const profile = await oldApi.auth.getProfile();

        expect(profile.response).toHaveStatus4xx();
    });

    test("[AUTH-015] Old refresh token doesn't work after refresh", async ({ api, spawnUser }) => {
        const user = await spawnUser();
        
        const login = await api.auth.login({
            identifier: user.email,
            password: user.password,
        });
        expect(login.response).toHaveStatus2xx();

        const oldApi = api.cloneWithContext();
        const refresh = await api.auth.refreshToken();

        expect(refresh.response).toHaveStatus2xx();
        const repeatRefresh = await oldApi.auth.refreshToken();

        expect(repeatRefresh.response).toHaveStatus4xx();
    });
})