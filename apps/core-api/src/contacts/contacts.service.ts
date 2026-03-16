import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactEntity } from './entities/contact.entity';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(ContactEntity)
    private readonly repository: Repository<ContactEntity>,
  ) {}

  async findAllForUser(ownerId: string): Promise<ContactEntity[]> {
    return this.repository.find({
      where: { ownerId },
    });
  }

  async create(ownerId: string, dto: CreateContactDto): Promise<ContactEntity> {
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

  async setAlias(ownerId: string, targetId: string, alias?: string): Promise<ContactEntity | void> {
    if (!alias || !alias.trim()) {
      // If alias is empty, remove the contact
      await this.repository.delete({ ownerId, targetId });
      return;
    }

    const existing = await this.repository.findOne({
      where: { ownerId, targetId },
    });

    if (existing) {
      existing.alias = alias;
      return this.repository.save(existing);
    }

    const contact = this.repository.create({
      ownerId,
      targetId,
      alias,
    });

    return this.repository.save(contact);
  }
}
