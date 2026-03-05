import { UserEntity } from "./user-interface";

export interface ContactEntity {
  id?: string;
  owner: UserEntity;
  target: UserEntity;
  alias: string;
}