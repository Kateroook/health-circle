import { utils } from "../../../utils/utils";
import { UserBuilder } from "../builders/user-builder";

export const UserFactory = {
    createUserForTest: (testId: string) => {
        return new UserBuilder()
            .withMiddleName(testId)
            .withEmail(utils.random.email({prefix: `test-${testId}`}))
            .build();
    },

    createRandomUser: () => {
        return new UserBuilder()
            .build();
    },
};