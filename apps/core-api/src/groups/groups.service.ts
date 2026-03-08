import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupEntity } from 'src/common/entities/group.entity';
import { GroupBlockListEntity } from 'src/common/entities/group-block-list.entity';
import { UserEntity } from 'src/common/entities/user.entity';
import { ContactsService } from 'src/contacts/contacts.service';
import { FirestoreSyncService } from 'src/notifications/firestore-sync.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { SecurityService } from 'src/security/security.service';
import { In, Repository } from 'typeorm';

import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly repository: Repository<GroupEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(GroupBlockListEntity)
    private readonly blockListRepository: Repository<GroupBlockListEntity>,
    private readonly securityService: SecurityService,
    private readonly contactsService: ContactsService,
    private readonly firestoreSyncService: FirestoreSyncService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async syncGroupMembers(group: GroupEntity) {
    if (!group.members) return;
    const memberIds = group.members.map((m) => m.id);
    await this.firestoreSyncService.sendSyncSignal(memberIds);
  }

  async findAllForUser(userId: string) {
    const groups = await this.repository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.owner', 'owner')
      .leftJoinAndSelect('group.members', 'member')
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('g.id')
          .from(GroupEntity, 'g')
          .leftJoin('g.members', 'm')
          .where('m.id = :userId')
          .getQuery();
        return 'group.id IN ' + subQuery;
      })
      .setParameter('userId', userId)
      .getMany();

    const contacts = await this.contactsService.findAllForUser(userId);
    const contactsMap = new Map(contacts.map((c) => [c.targetId, c.alias]));

    return groups.map((g) => {
      g.members = g.members.filter((m) => m.id !== userId);
      g.members.forEach((m: UserEntity) => {
        const alias = contactsMap.get(m.id);
        if (alias) {
          m.fullName = alias;
          m.isAlias = true;
        } else {
          m.isAlias = false;
          if (!m.fullName) {
            m.fullName = `${m.firstName} ${m.lastName}`.trim();
          }
        }
      });
      return g;
    });
  }

  async findOne(id: string, userId: string) {
    const group = await this.repository.findOne({
      where: { id },
      relations: ['owner', 'members'],
    });
    if (!group) throw new NotFoundException('Коло не знайдено');
    const isMember = group.members.some((member) => member.id === userId);
    if (!isMember && group.owner.id !== userId) throw new ForbiddenException('Доступ заборонено');

    const contacts = await this.contactsService.findAllForUser(userId);
    const contactsMap = new Map(contacts.map((c) => [c.targetId, c.alias]));

    group.members.forEach((m: UserEntity) => {
      if (m.id === userId) return;
      const alias = contactsMap.get(m.id);
      if (alias) {
        m.fullName = alias;
        m.isAlias = true;
      } else {
        m.isAlias = false;
        if (!m.fullName) {
          m.fullName = `${m.firstName} ${m.lastName}`.trim();
        }
      }
    });

    return group;
  }

  async createGroup(ownerId: string, dto: CreateGroupDto) {
    const owner = { id: ownerId } as UserEntity;
    const code = await this.generateUniqueInviteCode();
    const saved = await this.repository.save({
      owner,
      name: dto.name,
      members: [owner],
      inviteCode: code,
    });
    await this.syncGroupMembers(saved);
    return saved;
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
    const group = await this.findOne(groupId, userId);
    if (group.owner.id !== userId) throw new ForbiddenException('Тільки власник може оновлювати код запрошення');
    const code = await this.generateUniqueInviteCode();
    group.inviteCode = code;
    await this.repository.save(group);
    return { code };
  }

  async joinByInviteCode(userId: string, code: string) {
    const group = await this.repository.findOne({
      where: { inviteCode: code },
      relations: ['members', 'owner'],
    });
    if (!group) throw new NotFoundException('Код недійсний');

    // Check if user is blocked
    const isBlocked = await this.blockListRepository.findOne({
      where: { group: { id: group.id }, user: { id: userId } },
    });
    if (isBlocked) throw new ForbiddenException('Ви заблоковані в цьому колі');

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Користувач не знайдено');
    if (group.members.some((m) => m.id === userId)) throw new BadRequestException('Ви вже приєднались до цього кола');
    group.members.push(user);
    const saved = await this.repository.save(group);
    await this.syncGroupMembers(saved);
    return { message: 'Ви приєдналися до кола', group: saved };
  }

  async updateGroup(userId: string, dto: UpdateGroupDto) {
    const group = await this.findOne(dto.id, userId);
    if (group.owner.id !== userId) throw new ForbiddenException('Тільки власник може оновлювати коло');
    if (dto.name) group.name = dto.name;
    if (dto.members) {
      const members = await this.userRepository.find({ where: { id: In(dto.members.map((m) => m.id)) } });
      group.members = [group.owner, ...members.filter((m) => m.id !== group.owner.id)];
    }
    const saved = await this.repository.save(group);
    await this.syncGroupMembers(saved);
    return saved;
  }

  async leaveGroup(userId: string, groupId: string) {
    const group = await this.repository.findOne({
      where: { id: groupId },
      relations: ['owner', 'members'],
    });
    if (!group) throw new NotFoundException('Коло не знайдено');
    if (group.owner.id === userId) {
      throw new ForbiddenException('Власник не може покинути коло. Видаліть коло натомість');
    }
    const leavingUserId = userId;
    group.members = group.members.filter((m) => m.id !== userId);
    const saved = await this.repository.save(group);
    await this.firestoreSyncService.sendSyncSignal([...saved.members.map((m) => m.id), leavingUserId]);
    return { message: 'Ви покинули коло' };
  }

  async deleteGroup(userId: string, groupId: string) {
    const group = await this.findOne(groupId, userId);
    if (group.owner.id !== userId) throw new ForbiddenException('Тільки власник може видалити коло');
    const memberIds = group.members.map((m) => m.id);
    await this.repository.remove(group);
    await this.firestoreSyncService.sendSyncSignal(memberIds);
    return { message: 'Коло успішно видалено' };
  }

  async blockUser(groupId: string, userId: string, requesterId: string) {
    const group = await this.findOne(groupId, requesterId);
    if (group.owner.id !== requesterId) throw new ForbiddenException('Тільки власник може блокувати користувачів');
    if (userId === requesterId) throw new BadRequestException('Ви не можете заблокувати самі себе');

    // Remove user from group if member
    if (group.members.some((m) => m.id === userId)) {
      group.members = group.members.filter((m) => m.id !== userId);
      await this.repository.save(group);
      await this.firestoreSyncService.sendSyncSignal([...group.members.map((m) => m.id), userId]);
    }

    // Add to block list
    await this.blockListRepository.upsert(
      {
        group: { id: groupId },
        user: { id: userId },
        createdBy: { id: requesterId },
      },
      ['group', 'user'],
    );
    return { message: 'Користувач заблокований' };
  }

  async unblockUser(groupId: string, userId: string, requesterId: string) {
    const group = await this.findOne(groupId, requesterId);
    if (group.owner.id !== requesterId) throw new ForbiddenException('Тільки власник може розблокувати користувачів');

    await this.blockListRepository.delete({
      group: { id: groupId },
      user: { id: userId },
    });
    return { message: 'Користувач розблокований' };
  }

  async getBlockedUsers(groupId: string, requesterId: string) {
    const group = await this.findOne(groupId, requesterId);
    if (group.owner.id !== requesterId) throw new ForbiddenException('Тільки власник може переглядати заблокованих користувачів');

    return this.blockListRepository.find({
      where: { group: { id: groupId } },
      relations: ['user'],
    });
  }

  async initiateRollCall(groupId: string, userId: string) {
    const group = await this.repository.findOne({
      where: { id: groupId },
      relations: ['owner', 'members'],
    });
    if (!group) throw new NotFoundException('Коло не знайдено');
    if (group.owner.id !== userId) throw new ForbiddenException('Тільки власник може ініціювати перекличку');

    group.lastRollCallAt = new Date();
    await this.repository.save(group);

    const tokens = group.members.filter((m) => m.id !== userId && m.fcmToken).map((m) => m.fcmToken as string);

    if (tokens.length > 0) {
      await this.notificationsService.sendMulticast(
        tokens,
        'Перекличка! 📢',
        `Адміністратор кола "${group.name}" просить підтвердити ваш статус безпеки.`,
        {
          groupId: group.id,
          type: 'ROLL_CALL',
        },
      );
    }

    return { message: 'Перекличку розпочато' };
  }
}
