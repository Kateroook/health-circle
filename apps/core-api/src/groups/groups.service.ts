import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactsService } from 'src/contacts/contacts.service';
import { FirestoreSyncService } from 'src/notifications/firestore-sync.service';
import { NotificationTemplates, NotificationType } from 'src/notifications/notification-types';
import { NotificationsService } from 'src/notifications/notifications.service';
import { SecurityService } from 'src/security/security.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { In, Repository } from 'typeorm';

import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupEntity } from './entities/group.entity';
import { GroupBlockListEntity } from './entities/group-block-list.entity';
import { GroupMemberEntity } from './entities/group-member.entity';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly repository: Repository<GroupEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(GroupMemberEntity)
    private readonly memberRepository: Repository<GroupMemberEntity>,
    @InjectRepository(GroupBlockListEntity)
    private readonly blockListRepository: Repository<GroupBlockListEntity>,
    private readonly securityService: SecurityService,
    private readonly contactsService: ContactsService,
    private readonly firestoreSyncService: FirestoreSyncService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  private async findUsersByIds(ids: string[]): Promise<UserEntity[]> {
    if (ids.length === 0) return [];
    return this.userRepository.find({ where: { id: In(ids) } });
  }

  private async userExists(id: string): Promise<boolean> {
    return this.userRepository.existsBy({ id });
  }

  private async findUserById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOneBy({ id });
  }

  private async updateLastPersonalRollCallAt(id: string): Promise<void> {
    await this.userRepository.update({ id }, { lastPersonalRollCallAt: new Date() });
  }

  private async syncGroupMembers(groupId: string) {
    const memberships = await this.memberRepository.find({ where: { groupId } });
    const memberIds = memberships.map((m) => m.userId);
    await this.firestoreSyncService.sendSyncSignal(memberIds);
  }

  async findAllForUser(userId: string) {
    const memberships = await this.memberRepository.find({
      where: { userId },
      relations: ['group'],
    });

    const groupIds = memberships.map((m) => m.groupId);
    if (groupIds.length === 0) return [];

    const groups = await this.repository.find({
      where: { id: In(groupIds) },
      relations: ['members'], // Note: this fetches local memberships only
    });

    const allMemberIds = new Set<string>();
    groups.forEach((g) => g.members.forEach((m) => allMemberIds.add(m.userId)));
    allMemberIds.add(userId);
    groups.forEach((g) => allMemberIds.add(g.ownerId));

    const users = await this.findUsersByIds(Array.from(allMemberIds));
    const usersMap = new Map(users.map((u) => [u.id, u]));

    const contacts = await this.contactsService.findAllForUser(userId);
    const contactsMap = new Map(contacts.map((c) => [c.targetId, c.alias]));

    return groups.map((g) => {
      const gData = g as any;
      gData.owner = usersMap.get(g.ownerId);
      gData.members = g.members
        .filter((m) => m.userId !== userId)
        .map((m) => {
          const u = usersMap.get(m.userId);
          if (!u) return null;
          const memberData = { ...u } as any;
          const alias = contactsMap.get(u.id);
          if (alias) {
            memberData.fullName = alias;
            memberData.isAlias = true;
          } else {
            memberData.isAlias = false;
            if (!memberData.fullName) {
              memberData.fullName = `${memberData.firstName} ${memberData.lastName}`.trim();
            }
          }
          return memberData;
        })
        .filter((m) => !!m);
      return gData;
    });
  }

  async findOne(id: string, userId: string) {
    const group = await this.repository.findOne({
      where: { id },
      relations: ['members'],
    });
    if (!group) throw new NotFoundException('Коло не знайдено');

    const isMember = group.members.some((member) => member.userId === userId);
    if (!isMember && group.ownerId !== userId) throw new ForbiddenException('Доступ заборонено');

    const allMemberIds = group.members.map((m) => m.userId);
    allMemberIds.push(group.ownerId);

    const users = await this.findUsersByIds(allMemberIds);
    const usersMap = new Map(users.map((u) => [u.id, u]));

    const contacts = await this.contactsService.findAllForUser(userId);
    const contactsMap = new Map(contacts.map((c) => [c.targetId, c.alias]));

    const groupData = group as any;
    groupData.owner = usersMap.get(group.ownerId);
    groupData.members = group.members
      .map((m) => {
        const u = usersMap.get(m.userId);
        if (!u) return null;
        const memberData = { ...u } as any;
        if (u.id === userId) return memberData;

        const alias = contactsMap.get(u.id);
        if (alias) {
          memberData.fullName = alias;
          memberData.isAlias = true;
        } else {
          memberData.isAlias = false;
          if (!memberData.fullName) {
            memberData.fullName = `${memberData.firstName} ${memberData.lastName}`.trim();
          }
        }
        return memberData;
      })
      .filter((m) => !!m);

    return groupData;
  }

  async createGroup(ownerId: string, dto: CreateGroupDto) {
    const code = await this.generateUniqueInviteCode();
    const group = await this.repository.save({
      ownerId,
      name: dto.name,
      inviteCode: code,
    });

    await this.memberRepository.save({
      groupId: group.id,
      userId: ownerId,
    });

    await this.syncGroupMembers(group.id);
    return this.findOne(group.id, ownerId);
  }

  async generateUniqueInviteCode(maxAttempts = 10): Promise<string> {
    let code: string;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      code = this.securityService.generateRandomToken(3).toUpperCase();
      const group = await this.repository.findOneBy({ inviteCode: code });
      if (!group) return code;
    }
    throw new Error('Не вдалося згенерувати унікальний код запрошення. Спробуйте ще раз.');
  }

  async regenerateInviteCode(userId: string, groupId: string) {
    const group = await this.repository.findOneBy({ id: groupId });
    if (!group) throw new NotFoundException('Коло не знайдено');
    if (group.ownerId !== userId) throw new ForbiddenException('Тільки власник може оновлювати код запрошення');
    const code = await this.generateUniqueInviteCode();
    group.inviteCode = code;
    await this.repository.save(group);
    return { code };
  }

  async joinByInviteCode(userId: string, code: string) {
    const group = await this.repository.findOne({
      where: { inviteCode: code },
      relations: ['members'],
    });
    if (!group) throw new NotFoundException('Код недійсний');

    // Check if user is blocked
    const isBlocked = await this.blockListRepository.findOne({
      where: { groupId: group.id, userId },
    });
    if (isBlocked) throw new ForbiddenException('Ви заблоковані в цьому колі');

    const userExists = await this.userExists(userId);
    if (!userExists) throw new NotFoundException('Користувач не знайдено');

    if (group.members.some((m) => m.userId === userId)) throw new BadRequestException('Ви вже приєднались до цього кола');

    await this.memberRepository.save({
      groupId: group.id,
      userId,
    });

    await this.syncGroupMembers(group.id);
    return { message: 'Ви приєдналися до кола', group: await this.findOne(group.id, userId) };
  }

  async updateGroup(userId: string, dto: UpdateGroupDto) {
    const group = await this.repository.findOne({ where: { id: dto.id }, relations: ['members'] });
    if (!group) throw new NotFoundException('Коло не знайдено');
    if (group.ownerId !== userId) throw new ForbiddenException('Тільки власник може оновлювати коло');

    if (dto.name) group.name = dto.name;

    if (dto.members) {
      // Simplistic approach: replace memberships
      await this.memberRepository.delete({ groupId: group.id });
      const newMemberships = dto.members.map((m) => ({ groupId: group.id, userId: m.id }));
      // Ensure owner is always a member
      if (!newMemberships.find((m) => m.userId === group.ownerId)) {
        newMemberships.push({ groupId: group.id, userId: group.ownerId });
      }
      await this.memberRepository.save(newMemberships);
    }

    const saved = await this.repository.save(group);
    await this.syncGroupMembers(saved.id);
    return this.findOne(saved.id, userId);
  }

  async leaveGroup(userId: string, groupId: string) {
    const group = await this.repository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Коло не знайдено');
    if (group.ownerId === userId) {
      throw new ForbiddenException('Власник не може покинути коло. Видаліть коло натомість');
    }

    await this.memberRepository.delete({ groupId, userId });
    await this.syncGroupMembers(groupId);
    await this.firestoreSyncService.sendSyncSignal([userId]); // Signal the leaver too

    return { message: 'Ви покинули коло' };
  }

  async deleteGroup(userId: string, groupId: string) {
    const group = await this.repository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Коло не знайдено');
    if (group.ownerId !== userId) throw new ForbiddenException('Тільки власник може видалити коло');

    const memberships = await this.memberRepository.find({ where: { groupId } });
    const memberIds = memberships.map((m) => m.userId);

    await this.repository.remove(group);
    await this.firestoreSyncService.sendSyncSignal(memberIds);
    return { message: 'Коло успішно видалено' };
  }

  async blockUser(groupId: string, userId: string, requesterId: string) {
    const group = await this.repository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Коло не знайдено');
    if (group.ownerId !== requesterId) throw new ForbiddenException('Тільки власник може блокувати користувачів');
    if (userId === requesterId) throw new BadRequestException('Ви не можете заблокувати самі себе');

    // Remove user from memberships if present
    await this.memberRepository.delete({ groupId, userId });

    // Add to block list
    await this.blockListRepository.upsert(
      {
        groupId,
        userId,
        createdBy: requesterId,
      },
      ['groupId', 'userId'],
    );

    await this.syncGroupMembers(groupId);
    await this.firestoreSyncService.sendSyncSignal([userId]);

    return { message: 'Користувач заблокований' };
  }

  async unblockUser(groupId: string, userId: string, requesterId: string) {
    const group = await this.repository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Коло не знайдено');
    if (group.ownerId !== requesterId) throw new ForbiddenException('Тільки власник може розблокувати користувачів');

    await this.blockListRepository.delete({ groupId, userId });
    return { message: 'Користувач розблокований' };
  }

  async getBlockedUsers(groupId: string, requesterId: string) {
    const group = await this.repository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Коло не знайдено');
    if (group.ownerId !== requesterId) throw new ForbiddenException('Тільки власник може переглядати заблокованих користувачів');

    const blocked = await this.blockListRepository.find({
      where: { groupId },
    });

    const userIds = blocked.map((b) => b.userId);
    const users = await this.findUsersByIds(userIds);
    const usersMap = new Map(users.map((u) => [u.id, u]));

    return blocked.map((b) => ({
      ...b,
      user: usersMap.get(b.userId),
    }));
  }

  async initiateRollCall(groupId: string, userId: string) {
    const group = await this.repository.findOne({
      where: { id: groupId },
      relations: ['members'],
    });
    if (!group) throw new NotFoundException('Коло не знайдено');
    const isMember = group.members.some((m) => m.userId === userId) || group.ownerId === userId;
    if (!isMember) throw new ForbiddenException('Тільки учасники можуть ініціювати перекличку');

    group.lastRollCallAt = new Date();
    await this.repository.save(group);

    const memberIds = group.members.map((m) => m.userId).filter((id) => id !== userId);
    const type = NotificationType.ROLL_CALL;
    const tokens = await this.usersService.getTokensForUsers(memberIds, NotificationTemplates[type].permissionKey);

    if (tokens.length > 0) {
      await this.notificationsService.sendMulticastByType(
        tokens,
        type,
        { groupName: group.name },
        {
          groupId: group.id,
        },
      );
    }

    return { message: 'Перекличку розпочато' };
  }

  async initiatePersonalRollCall(groupId: string, targetUserId: string, requesterId: string) {
    const group = await this.repository.findOne({
      where: { id: groupId },
      relations: ['members'],
    });

    if (!group) throw new NotFoundException('Коло не знайдено');
    const isMemberRequester = group.members.some((m) => m.userId === requesterId) || group.ownerId === requesterId;
    if (!isMemberRequester) throw new ForbiddenException('Тільки учасники можуть ініціювати перекличку');

    const isMember = group.members.find((m) => m.userId === targetUserId);
    if (!isMember) throw new NotFoundException('Користувач не є учасником цього кола');

    const targetUser = await this.findUserById(targetUserId);
    if (!targetUser) throw new NotFoundException('Користувача не знайдено');

    const graceSeconds = this.configService.get<number>('PERSONAL_ROLL_CALL_GRACE_SECONDS', 15 * 60);
    const graceThreshold = new Date(Date.now() - graceSeconds * 1000);

    if (targetUser.lastStatusUpdate > graceThreshold) {
      return { message: 'Користувач нещодавно оновив статус, додатковий запит не потрібен' };
    }

    await this.updateLastPersonalRollCallAt(targetUserId);

    const tokens = await this.usersService.getTokensForUsers(
      [targetUserId],
      NotificationTemplates[NotificationType.PERSONAL_ROLL_CALL].permissionKey,
    );

    if (tokens.length > 0) {
      await this.notificationsService.sendMulticastByType(
        tokens,
        NotificationType.PERSONAL_ROLL_CALL,
        { groupName: group.name },
        {
          groupId: group.id,
        },
      );
    }

    return { message: 'Вимогу оновлення статусу надіслано' };
  }
}
