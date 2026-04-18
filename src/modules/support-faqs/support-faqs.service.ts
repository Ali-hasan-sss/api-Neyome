import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportFaq } from '../../entities/support-faq.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateSupportFaqDto } from './dto/create-support-faq.dto';
import { UpdateSupportFaqDto } from './dto/update-support-faq.dto';

@Injectable()
export class SupportFaqsService {
  constructor(
    @InjectRepository(SupportFaq)
    private readonly repo: Repository<SupportFaq>,
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
    if (!entity) throw new NotFoundException('Support FAQ not found');
    return entity;
  }

  async create(dto: CreateSupportFaqDto) {
    const entity = this.repo.create(dto as any);
    return await this.repo.save(entity);
  }

  async update(id: string, dto: UpdateSupportFaqDto) {
    const existing = await this.findOne(id);
    Object.assign(existing, dto);
    return await this.repo.save(existing);
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
    return { id };
  }
}
