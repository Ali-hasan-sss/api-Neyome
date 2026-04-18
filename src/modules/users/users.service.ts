import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { User } from '../../entities/user.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findAll(query: PaginationQueryDto & { name?: string; email?: string }) {
    const { page = 1, limit = 20, sortBy, sortOrder, name, email } = query;

    const where: FindOptionsWhere<User> = {};
    if (name) where.name = ILike(`%${name}%`);
    if (email) where.email = ILike(`%${email}%`);

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
    const entity = await this.repo.findOne({ where: { id } });
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
    return await this.repo.save(existing);
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
