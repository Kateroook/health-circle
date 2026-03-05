import { utils } from '../../../utils/utils';
import { GroupEntity } from '../../types/entites/group-interface';
import { UserEntity } from '../../types/entites/user-interface';
import { UserFactory } from '../factories/user-factory';

export class GroupBuilder {
  private group: GroupEntity;

  constructor(overrides?: Partial<GroupEntity>) {
    this.group = {
      name: utils.random.groupName(),
      owner: UserFactory.createRandomUser(), // Дефолтний власник
      members: [],
      ...overrides,
    };
  }

  withInviteCode(code: string): this {
    this.group.inviteCode = code;
    return this;
  }

  withName(name: string): this {
    this.group.name = name;
    return this;
  }

  withOwner(user: UserEntity): this {
    this.group.owner = user;
    this.addMember(user);
    return this;
  }

  addMember(user: UserEntity): this {
    this.group.members.push(user);
    return this;
  }

  withMembers(users: UserEntity[]): this {
    this.group.members = users;
    return this;
  }

  build(): GroupEntity {
    return this.group;
  }
}
