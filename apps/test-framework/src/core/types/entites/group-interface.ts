import { UserEntity } from "./user-interface";

export interface GroupEntity {
    id?: string;
    name: string;
    owner: UserEntity;
    members: UserEntity[];
    inviteCode?: string;
}