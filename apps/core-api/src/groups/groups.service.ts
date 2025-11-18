import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Cache } from 'cache-manager';
import { GroupEntity } from 'src/common/entities/group.entity';
import { UserEntity } from 'src/common/entities/user.entity';
import { SecurityService } from 'src/security/security.service';
import { Repository } from 'typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

interface InviteCacheValue {
  groupId: string;
}

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly repository: Repository<GroupEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly securityService: SecurityService,
  ) {}

  async findAllForUser(userId: string) {
    return this.repository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.owner', 'owner')
      .leftJoinAndSelect('group.members', 'member')
      .where('owner.id = :userId OR member.id = :userId', { userId })
      .getMany();
  }

  async findOne(id: string, userId: string) {
    const group = await this.repository.findOne({
      where: { id },
      relations: ['owner', 'members'],
    });
    if (!group) throw new NotFoundException('Групу не знайдено');
    const isMember = group.members.some((member) => member.id === userId);
    if (group.owner.id !== userId && !isMember) throw new ForbiddenException('Доступ заборонено');
    return group;
  }

  async createGroup(ownerId: string, dto: CreateGroupDto) {
    const owner = { id: ownerId } as UserEntity;
    return this.repository.save({
      owner,
      name: dto.name,
      members: [owner],
    });
  }

  async updateGroup(userId: string, dto: UpdateGroupDto) {
    const group = await this.findOne(dto.id, userId);
    if (group.owner.id !== userId) throw new ForbiddenException('Тільки власник може оновлювати групу');
    return this.repository.save(dto);
  }

  async deleteGroup(userId: string, id: string) {
    const group = await this.findOne(id, userId);
    if (group.owner.id !== userId) throw new ForbiddenException('Тільки власник може видалити групу');

    const token = await this.cacheManager.get<string>(`group_invite:${id}`);
    if (token) {
      await this.cacheManager.del(`invite:${token}`);
      await this.cacheManager.del(`group_invite:${id}`);
    }
    await this.repository.remove(group);
    return { message: 'Групу успішно видалено' };
  }

  async generateInviteLink(userId: string, groupId: string) {
    const group = await this.findOne(groupId, userId);
    if (group.owner.id !== userId) throw new ForbiddenException('Тільки власник може створювати запрошення');
    const token = this.securityService.generateRandomToken(32);
    const oldToken = await this.cacheManager.get<string>(`group_invite:${groupId}`);
    if (oldToken) {
      await this.cacheManager.del(`invite:${oldToken}`);
      await this.cacheManager.del(`group_invite:${groupId}`);
    }
    await this.cacheManager.set<InviteCacheValue>(`invite:${token}`, { groupId });
    await this.cacheManager.set(`group_invite:${groupId}`, token);
    return { inviteUrl: `health-circle://invite?token=${token}` };
  }

  async joinByInvite(userId: string, token: string) {
    const data = await this.cacheManager.get<InviteCacheValue>(`invite:${token}`);
    if (!data) throw new NotFoundException('Посилання недійсне або прострочене');
    const group = await this.findOne(data.groupId, userId);
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Користувач не знайдений');
    if (group.members.some((m) => m.id === userId)) return { message: 'Ви вже приєднались до цієї групи' };
    group.members.push(user);
    await this.repository.save(group);
    return { message: 'Ви приєдналися до групи', group };
  }
}
