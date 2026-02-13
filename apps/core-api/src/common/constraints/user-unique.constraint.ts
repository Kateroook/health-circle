import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { ModifyUserDto } from 'src/users/dto/modify-user.dto';
import { Repository } from 'typeorm';

import { UserEntity } from '../entities/user.entity';

@ValidatorConstraint({ name: 'IsUserUnique', async: true })
@Injectable()
export class UserUniqueConstraint implements ValidatorConstraintInterface {
  constructor(@InjectRepository(UserEntity) private readonly usersRepository: Repository<UserEntity>) {}

  async validate(value: string, args: ValidationArguments): Promise<boolean> {
    if (value === undefined || value === null || value === '') return true;

    if (!args.constraints || args.constraints.length === 0)
      throw new BadRequestException('Відсутні обмеження для перевірки унікальності користувача');
    const [entityField] = args.constraints as [string];
    if (!entityField || entityField === '')
      throw new BadRequestException('Не вказано імʼя поля в обмеженні унікальності для сутності користувача');

    const dto: ModifyUserDto = args.object as ModifyUserDto;
    const qb = this.usersRepository.createQueryBuilder('user').where(`user.${entityField} = :value`, { value });

    if (dto.id) {
      qb.andWhere('user.id != :id', { id: dto.id });
    }

    const exists = await qb.getExists();
    return !exists;
  }

  defaultMessage(args: ValidationArguments) {
    const field = args.property;
    const value = args.value as string;
    return `Значення ${value} для поля ${field} вже використовується`;
  }
}
