import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GroupEntity } from 'src/common/entities/group.entity';
import { UserEntity } from 'src/common/entities/user.entity';
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
    private readonly securityService: SecurityService,
  ) {}

  async findAllForUser(userId: string) {
    return this.repository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.owner', 'owner')
      .leftJoinAndSelect('group.members', 'member')
      .where('member.id <> :userId', { userId })
      .getMany();
  }

  async findOne(id: string, userId: string) {
    const group = await this.repository.findOne({
      where: { id },
      relations: ['owner', 'members'],
    });
    if (!group) throw new NotFoundException('Групу не знайдено');
    const isMember = group.members.some((member) => member.id === userId);
    if (!isMember && group.owner.id !== userId) throw new ForbiddenException('Доступ заборонено');
    return group;
  }

  async createGroup(ownerId: string, dto: CreateGroupDto) {
    const owner = { id: ownerId } as UserEntity;
    const code = await this.generateUniqueInviteCode();
    return await this.repository.save({
      owner,
      name: dto.name,
      members: [owner],
      inviteCode: code,
    });
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
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Користувач не знайдено');
    if (group.members.some((m) => m.id === userId)) throw new BadRequestException('Ви вже приєднались до цієї групи');
    group.members.push(user);
    await this.repository.save(group);
    return { message: 'Ви приєдналися до групи', group };
  }

  async updateGroup(userId: string, dto: UpdateGroupDto) {
    const group = await this.findOne(dto.id, userId);
    if (group.owner.id !== userId) throw new ForbiddenException('Тільки власник може оновлювати групу');
    if (dto.name) group.name = dto.name;
    if (dto.members) {
      const members = await this.userRepository.find({ where: { id: In(dto.members.map((m) => m.id)) } });
      group.members = [group.owner, ...members.filter((m) => m.id !== group.owner.id)];
    }
    return this.repository.save(group);
  }

  async deleteGroup(userId: string, groupId: string) {
    const group = await this.findOne(groupId, userId);
    if (group.owner.id !== userId) throw new ForbiddenException('Тільки власник може видалити групу');
    await this.repository.remove(group);
    return { message: 'Групу успішно видалено' };
  }
}
