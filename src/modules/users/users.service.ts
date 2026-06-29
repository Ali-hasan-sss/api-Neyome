import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { User } from '../../entities/user.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    private readonly uploadsService: UploadsService,
  ) {}

  async findAll(
    query: PaginationQueryDto & { name?: string; email?: string; search?: string },
  ) {
    const { page = 1, limit = 20, sortBy, sortOrder, name, email, search } = query;

    const term = search?.trim();
    let where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = {};
    if (term) {
      const like = ILike(`%${term}%`);
      where = [{ name: like }, { email: like }];
    } else {
      const single: FindOptionsWhere<User> = {};
      if (name) single.name = ILike(`%${name}%`);
      if (email) single.email = ILike(`%${email}%`);
      where = single;
    }

    const [items, total] = await this.repo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: sortBy ? { [sortBy]: (sortOrder ?? 'ASC') as any } : undefined,
      relations: { family: true },
      withDeleted: false,
    });

    return { items, total, page, limit };
  }

  async findAllForFamily(familyId: string, query: PaginationQueryDto & { name?: string }) {
    const { page = 1, limit = 20, sortBy, sortOrder, name } = query;

    const where: FindOptionsWhere<User> = { familyId };
    if (name) where.name = ILike(`%${name}%`);

    const [items, total] = await this.repo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: sortBy ? { [sortBy]: (sortOrder ?? 'ASC') as any } : undefined,
      withDeleted: false,
    });

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id }, relations: { family: true } });
    if (!entity) throw new NotFoundException('User not found');
    return entity;
  }

  async findOneForFamily(id: string, familyId: string) {
    const entity = await this.repo.findOne({ where: { id, familyId } });
    if (!entity) throw new NotFoundException('User not found');
    return entity;
  }

  async create(dto: CreateUserDto) {
    const entity = this.repo.create(dto);
    return await this.repo.save(entity);
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.findOne(id);
    Object.assign(existing, dto);
    existing.updatedAt = new Date();
    return await this.repo.save(existing);
  }

  async updateMe(id: string, dto: UpdateMeDto, file?: Express.Multer.File) {
    const existing = await this.findOne(id);

    if (file) {
      await this.uploadsService.deleteLocalAvatar(existing.profileImageUrl);
      existing.profileImageUrl = await this.uploadsService.saveAvatar(id, file);
    }

    if (dto.name !== undefined) existing.name = dto.name;
    if (dto.locale !== undefined) existing.locale = dto.locale;
    if (dto.emojiOption !== undefined) existing.emojiOption = dto.emojiOption;

    existing.updatedAt = new Date();
    return await this.repo.save(existing);
  }

  async updateAvatar(id: string, file: Express.Multer.File) {
    return this.updateMe(id, {}, file);
  }

  async updateForFamily(id: string, familyId: string, dto: UpdateUserDto) {
    const existing = await this.findOneForFamily(id, familyId);
    Object.assign(existing, dto);
    return await this.repo.save(existing);
  }

  async remove(id: string) {
    // soft delete
    await this.repo.softDelete(id);
    return { id };
  }

  async removeForFamily(id: string, familyId: string) {
    const entity = await this.findOneForFamily(id, familyId);
    await this.repo.softDelete(entity.id);
    return { id: entity.id };
  }
}
