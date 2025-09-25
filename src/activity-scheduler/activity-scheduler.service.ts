import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserService } from '../user/user.service'; // Путь к сервису пользователей

@Injectable()
export class ActivitySchedulerService {
  constructor(private readonly userService: UserService) {}

  @Cron(CronExpression.EVERY_30_MINUTES) // Раз в час
  handleCron() {
    console.log('Executing activity update...');
    this.userService.fakeActivity(); // Вызов метода активности
  }
}
