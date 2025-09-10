import { Test, TestingModule } from '@nestjs/testing';
import { YoomoneyController } from './yoomoney.controller';
import { YoomoneyService } from './yoomoney.service';

describe('YoomoneyController', () => {
  let controller: YoomoneyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YoomoneyController],
      providers: [YoomoneyService],
    }).compile();

    controller = module.get<YoomoneyController>(YoomoneyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
