import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportCategory } from '../../entities/support-category.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateSupportCategoryDto } from './dto/create-support-category.dto';
import { UpdateSupportCategoryDto } from './dto/update-support-category.dto';

@Injectable()
export class SupportCategoriesService {
  constructor(
    @InjectRepository(SupportCategory)
    private readonly repo: Repository<SupportCategory>,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, sortBy, sortOrder } = query;
    const [items, total] = await this.repo.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      // order: sortBy ? { [sortBy]: (sortOrder ?? 'ASC') as any } : undefined,
      withDeleted: false,
    });
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Support category not found');
    return entity;
  }

  async create(dto: CreateSupportCategoryDto) {
    const entity = this.repo.create(dto);
    return await this.repo.save(entity);
  }

  async update(id: string, dto: UpdateSupportCategoryDto) {
    const existing = await this.findOne(id);
    Object.assign(existing, dto);
    return await this.repo.save(existing);
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
    return { id };
  }
}
