import { ApiClientFactory } from "../../core/api/api-client-factory";
import { test } from "../fixtures/api-fixture";

test("Create new user and delete him", async ({request, confirmationCodeRepository, userRepository}) => {
    const apiClient = new ApiClientFactory(request);

    const newUser = (
        await apiClient.users.createUser({
            email: "healthcircle-test+1@gmail.com",
            phone: "+380671045018",
            firstName: "Test",
            middleName: "User",
            lastName: "gen(a)",
        })
    ).data;

    console.log(newUser);

    const code = (await confirmationCodeRepository.findBy({userId: newUser.id}))[0];
    
    await apiClient.auth.setupPassword(newUser.email!, code.code, {
        newPassword: "A$$_Destroyed_1488",
        confirmNewPassword: "A$$_Destroyed_1488",
    })

    const final = await apiClient.users.getUser(newUser.id);
    console.log(final);
    await userRepository.delete(newUser.id);

    const deleted = await apiClient.users.getUser(newUser.id);

    console.log(deleted);
});