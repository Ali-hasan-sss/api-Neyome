import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Task } from '../../entities/task.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { StreaksService } from '../streaks/streaks.service';
import { BadgeAwardsService } from '../badges/badge-awards.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
    private readonly streaksService: StreaksService,
    private readonly badgeAwards: BadgeAwardsService,
  ) {}

  private isTaskCompleted(task: Pick<Task, 'completed' | 'status'>): boolean {
    if (task.completed === true) return true;
    const s = task.status?.trim().toLowerCase();
    return s === 'completed' || s === 'done' || s === 'approved';
  }

  private isTaskApproved(task: Pick<Task, 'status'>): boolean {
    return task.status?.trim().toLowerCase() === 'approved';
  }

  /** Map client `taskTypeId` onto `taskType` and drop the alias before persist. */
  private normalizeTaskInput(dto: CreateTaskDto | UpdateTaskDto): Partial<Task> {
    const { taskTypeId, ...rest } = dto as CreateTaskDto & { taskTypeId?: string };
    const patch = { ...rest } as Partial<Task>;
    if (taskTypeId != null && (patch.taskType == null || patch.taskType === '')) {
      patch.taskType = taskTypeId;
    }
    return patch;
  }

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
    const fields = this.normalizeTaskInput(dto);
    const entity = this.repo.create({
      ...fields,
      date: dto.date ? new Date(dto.date) : undefined,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
    } as Task);

    if (this.isTaskCompleted(entity) && !entity.completedAt) {
      entity.completedAt = new Date();
    }

    const saved = (await this.repo.save(entity)) as Task;

    if (this.isTaskCompleted(saved) && saved.assigneeId) {
      await this.streaksService.recordTaskCompletion(saved.assigneeId, {
        at: saved.completedAt ? new Date(saved.completedAt) : new Date(),
        dueAt: saved.dueAt,
        tz: saved.tz,
      });
    }
    if (this.isTaskApproved(saved) && saved.assigneeId) {
      await this.badgeAwards.evaluateUserSafely(saved.assigneeId);
    }

    return saved;
  }

  async update(id: string, dto: UpdateTaskDto) {
    const existing = await this.findOne(id);
    const fields = this.normalizeTaskInput(dto);
    Object.assign(existing, {
      ...fields,
      date: (dto as any).date ? new Date((dto as any).date) : existing.date,
      dueAt: (dto as any).dueAt ? new Date((dto as any).dueAt) : existing.dueAt,
    });
    return await this.repo.save(existing);
  }

  async updateForFamily(id: string, familyId: string, dto: UpdateTaskDto) {
    const existing = await this.findOneForFamily(id, familyId);
    const wasCompleted = this.isTaskCompleted(existing);
    const wasApproved = this.isTaskApproved(existing);
    const fields = this.normalizeTaskInput(dto);

    Object.assign(existing, {
      ...fields,
      date: (dto as any).date ? new Date((dto as any).date) : existing.date,
      dueAt: (dto as any).dueAt ? new Date((dto as any).dueAt) : existing.dueAt,
    });

    if (!wasCompleted && this.isTaskCompleted(existing) && !existing.completedAt) {
      existing.completedAt = new Date();
    }

    const saved = await this.repo.save(existing);

    if (!wasCompleted && this.isTaskCompleted(saved) && saved.assigneeId) {
      await this.streaksService.recordTaskCompletion(saved.assigneeId, {
        at: saved.completedAt ? new Date(saved.completedAt) : new Date(),
        dueAt: saved.dueAt,
        tz: saved.tz,
      });
    }
    if (!wasApproved && this.isTaskApproved(saved) && saved.assigneeId) {
      await this.badgeAwards.evaluateUserSafely(saved.assigneeId);
    }

    return saved;
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
