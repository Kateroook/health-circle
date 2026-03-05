import { UserEntity } from "../../types/entites/user-interface";
import { GroupBuilder } from "../builders/group-builder";
import { UserFactory } from "./user-factory";

export const GroupFactory = {
    createEmptyGroup: (name?: string) => {
        return new GroupBuilder()
            .withName(name || "Empty Test Group")
            .withMembers([])
            .build();
    },

    createFullGroup: (memberCount: number) => {
        const members = Array.from({ length: memberCount }, () => UserFactory.createRandomUser());
        return new GroupBuilder()
            .withName(`Big Group ${memberCount}`)
            .withMembers(members)
            .build();
    },

    createGroupWithSpecificOwner: (owner: UserEntity) => {
        return new GroupBuilder()
            .withOwner(owner)
            .build();
    }
};