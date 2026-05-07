import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSetting } from '../../entities/user-setting.entity';
import { UserSettingsService } from './user-settings.service';
import { UserSettingsController } from './user-settings.controller';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserSetting])],
  controllers: [UserSettingsController, NotificationsController],
  providers: [UserSettingsService],
  exports: [UserSettingsService],
})
export class UserSettingsModule {}
