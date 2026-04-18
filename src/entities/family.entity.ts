import { Entity, PrimaryColumn, Column, OneToMany, DeleteDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';
import { PointLedger } from './point-ledger.entity';
import { Badge } from './badge.entity';
import { RewardList } from './reward-list.entity';
import { TaskType } from './task-type.entity';

@Entity({ name: 'families' })
export class Family {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'text', nullable: true, unique: true })
  familyCode?: string;

  @Column({ type: 'text', nullable: true })
  name?: string;

  @Column({ type: 'uuid', nullable: true })
  creatorId?: string;

  @Column({ type: 'uuid', nullable: true })
  ownerId?: string;

  @Column({ type: 'timestamptz', nullable: true })
  createdAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  plan?: any;

  @OneToMany(() => User, (user) => user.family)
  users?: User[];

  @OneToMany(() => Task, (task) => task.family)
  tasks?: Task[];

  @OneToMany(() => PointLedger, (pl) => pl.family)
  pointLedgers?: PointLedger[];

  @OneToMany(() => Badge, (badge) => badge.family)
  badges?: Badge[];

  @OneToMany(() => RewardList, (rl) => rl.family)
  rewardLists?: RewardList[];

  @OneToMany(() => TaskType, (tt) => tt.family)
  taskTypes?: TaskType[];

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
