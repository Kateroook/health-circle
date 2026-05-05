import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';

import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactEntity } from './entities/contact.entity';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(ContactEntity)
    private readonly repository: Repository<ContactEntity>,
    private readonly usersService: UsersService,
  ) {}

  async findAllForUser(ownerId: string): Promise<ContactEntity[]> {
    return this.repository.find({
      where: { ownerId },
    });
  }

  async create(ownerId: string, dto: CreateContactDto): Promise<ContactEntity> {
    // Check if target user exists
    const targetUser = await this.usersService.exists(dto.target.id);
    if (!targetUser) {
      throw new BadRequestException('Користувача не знайдено');
    }

    const existing = await this.repository.findOne({
      where: { ownerId, targetId: dto.target.id },
    });

    if (existing) {
      throw new ConflictException('Контакт вже існує');
    }

    const contact = this.repository.create({
      ownerId,
      targetId: dto.target.id,
      alias: dto.alias,
    });

    return this.repository.save(contact);
  }

  async update(ownerId: string, targetId: string, dto: UpdateContactDto): Promise<ContactEntity> {
    const contact = await this.repository.findOne({
      where: { ownerId, targetId },
    });

    if (!contact) {
      throw new NotFoundException('Контакт не знайдено');
    }

    if (dto.alias) {
      contact.alias = dto.alias;
    }

    return this.repository.save(contact);
  }

  async remove(ownerId: string, targetId: string): Promise<void> {
    const result = await this.repository.delete({ ownerId, targetId });
    if (result.affected === 0) {
      throw new NotFoundException('Контакт не знайдено');
    }
  }

  async setAlias(ownerId: string, targetId: string, alias: string): Promise<ContactEntity> {
    const existing = await this.repository.findOne({
      where: { ownerId, targetId },
    });

    if (!existing) {
      throw new NotFoundException('Контакт не знайдено');
    }

    existing.alias = alias;
    return this.repository.save(existing);
  }
}
