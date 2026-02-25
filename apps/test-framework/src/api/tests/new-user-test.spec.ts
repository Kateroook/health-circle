import { expect } from "@playwright/test";
import { ApiClientFactory } from "../../core/api/api-client-factory";
import { test } from "../fixtures/api-fixture";

test("Create new user and delete him", async ({request, confirmationCodeRepository, dbCleaner}) => {
    const api = new ApiClientFactory({
        request: request, 
        dbCleaner: dbCleaner
    });

    const newUser = (
        await api.users.createUser({
            email: "healthcircle-test+1@gmail.com",
            phone: "+380671045018",
            firstName: "Test",
            middleName: "User",
            lastName: "gen(a)",
        })
    ).data;

    console.log(newUser);

    const code = (await confirmationCodeRepository.findBy({userId: newUser.id}))[0];
    const password = "A$$_Destroyed_1488";
    
    await api.auth.setupPassword(newUser.email!, code.code, {
        newPassword: password,
        confirmNewPassword: password,
    })

    await api.auth.login({
        email: newUser.email!,
        password: password,
    })

    const profile = (await api.auth.getProfile()).data;

    expect(newUser.id).toEqual(profile.id);
    expect(newUser.firstName).toEqual(profile.firstName);
    expect(newUser.lastName).toEqual(profile.lastName);
    expect(newUser.middleName).toEqual(profile.middleName);
    expect(newUser.phone).toEqual(profile.phone);

    console.log(profile);
});