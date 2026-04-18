import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Task } from '../../entities/task.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
  ) {}

  async findAll(query: PaginationQueryDto & { title?: string; status?: string; assigneeId?: string; familyId?: string }) {
    const { page = 1, limit = 20, sortBy, sortOrder, title, status, assigneeId, familyId } = query;

    const where: FindOptionsWhere<Task> = {};
    if (title) where.title = ILike(`%${title}%`);
    if (status) where.status = ILike(`%${status}%`);
    if (assigneeId) where.assigneeId = assigneeId as any;
    if (familyId) where.familyId = familyId as any;

    const [items, total] = await this.repo.findAndCount({
      where,
      take: limit,
      skip: (page - 1) * limit,
      order: sortBy ? { [sortBy]: (sortOrder ?? 'ASC') as any } : undefined,
      relations: { assignee: true, family: true },
      withDeleted: false,
    });

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Task not found');
    return entity;
  }

  async findOneForFamily(id: string, familyId: string) {
    const entity = await this.repo.findOne({ where: { id, familyId } });
    if (!entity) throw new NotFoundException('Task not found');
    return entity;
  }

  async create(dto: CreateTaskDto) {
    const entity = this.repo.create({
      ...dto,
      date: dto.date ? new Date(dto.date) : undefined,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
    } as any);
    return await this.repo.save(entity);
  }

  async update(id: string, dto: UpdateTaskDto) {
    const existing = await this.findOne(id);
    Object.assign(existing, {
      ...dto,
      date: (dto as any).date ? new Date((dto as any).date) : existing.date,
      dueAt: (dto as any).dueAt ? new Date((dto as any).dueAt) : existing.dueAt,
    });
    return await this.repo.save(existing);
  }

  async updateForFamily(id: string, familyId: string, dto: UpdateTaskDto) {
    const existing = await this.findOneForFamily(id, familyId);
    Object.assign(existing, {
      ...dto,
      date: (dto as any).date ? new Date((dto as any).date) : existing.date,
      dueAt: (dto as any).dueAt ? new Date((dto as any).dueAt) : existing.dueAt,
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
