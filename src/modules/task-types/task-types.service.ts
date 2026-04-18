import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskType } from '../../entities/task-type.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateTaskTypeDto } from './dto/create-task-type.dto';
import { UpdateTaskTypeDto } from './dto/update-task-type.dto';

@Injectable()
export class TaskTypesService {
  constructor(
    @InjectRepository(TaskType)
    private readonly repo: Repository<TaskType>,
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

  async findAllForFamily(familyId: string, query: PaginationQueryDto) {
    const { page = 1, limit = 20, sortBy, sortOrder } = query;
    const [items, total] = await this.repo.findAndCount({
      where: { familyId },
      take: limit,
      skip: (page - 1) * limit,
      order: sortBy ? { [sortBy]: (sortOrder ?? 'ASC') as any } : undefined,
      withDeleted: false,
    });
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Task type not found');
    return entity;
  }

  async findOneForFamily(id: string, familyId: string) {
    const entity = await this.repo.findOne({ where: { id, familyId } });
    if (!entity) throw new NotFoundException('Task type not found');
    return entity;
  }

  async create(dto: CreateTaskTypeDto) {
    const entity = this.repo.create({
      ...dto,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
    } as any);
    return await this.repo.save(entity);
  }

  async update(id: string, dto: UpdateTaskTypeDto) {
    const existing = await this.findOne(id);
    Object.assign(existing, {
      ...dto,
      createdAt: (dto as any).createdAt ? new Date((dto as any).createdAt) : existing.createdAt,
    });
    return await this.repo.save(existing);
  }

  async updateForFamily(id: string, familyId: string, dto: UpdateTaskTypeDto) {
    const existing = await this.findOneForFamily(id, familyId);
    Object.assign(existing, {
      ...dto,
      createdAt: (dto as any).createdAt ? new Date((dto as any).createdAt) : existing.createdAt,
    });
    return await this.repo.save(existing);
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
    return { id };
  }

  async removeForFamily(id: string, familyId: string) {
    const entity = await this.findOneForFamily(id, familyId);
    await this.repo.softDelete(entity.id);
    return { id: entity.id };
  }
}
