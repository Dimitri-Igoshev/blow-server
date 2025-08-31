import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserService } from '../user/user.service'; // Путь к сервису пользователей

@Injectable()
export class ActivitySchedulerService {
  constructor(private readonly userService: UserService) {}

  // Этот метод будет выполняться раз в час
  @Cron(CronExpression.EVERY_HOUR) // Раз в час
  handleCron() {
    console.log('Executing activity update...');
    this.userService.fakeActivity(); // Вызов метода активности
  }
}
