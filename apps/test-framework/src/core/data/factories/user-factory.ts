import { utils } from '../../../utils/utils';
import { UserEntity } from '../../types/entites/user-interface';
import { UserBuilder } from '../builders/user-builder';

export const UserFactory = {
  createUserForTest: (options: { testId: string; overrides?: Partial<UserEntity> }) => {
    return new UserBuilder(options.overrides)
      .withMiddleName(options.testId)
      .withEmail(utils.random.email({ prefix: `test.${options.testId}` }))
      .build();
  },

  createRandomUser: (overrides?: Partial<UserEntity>) => {
    return new UserBuilder(overrides).build();
  },
};
