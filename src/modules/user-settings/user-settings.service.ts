import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSetting } from '../../entities/user-setting.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateUserSettingDto } from './dto/create-user-setting.dto';
import { UpdateUserSettingDto } from './dto/update-user-setting.dto';

@Injectable()
export class UserSettingsService {
  constructor(
    @InjectRepository(UserSetting)
    private readonly repo: Repository<UserSetting>,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, sortBy, sortOrder } = query;
    const [items, total] = await this.repo.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: sortBy ? { [sortBy]: (sortOrder ?? 'ASC') as any } : undefined,
      withDeleted: false,
    });
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id } });
    return entity; // Return null if not found, user may not have settings yet
  }

  async upsert(id: string, dto: UpdateUserSettingDto) {
    let existing = await this.repo.findOne({ where: { id } });
    if (existing) {
      Object.assign(existing, {
        ...dto,
        updatedAt: new Date(),
      });
      return await this.repo.save(existing);
    } else {
      const entity = this.repo.create({
        id,
        ...dto,
        updatedAt: new Date(),
      } as any);
      return await this.repo.save(entity);
    }
  }

  async create(dto: CreateUserSettingDto) {
    const entity = this.repo.create({
      ...dto,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
    } as any);
    return await this.repo.save(entity);
  }

  async update(id: string, dto: UpdateUserSettingDto) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('User setting not found');
    Object.assign(existing, {
      ...dto,
      updatedAt: (dto as any).updatedAt ? new Date((dto as any).updatedAt) : existing.updatedAt,
    });
    return await this.repo.save(existing);
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
    return { id };
  }
}
