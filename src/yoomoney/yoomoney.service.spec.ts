import { Test, TestingModule } from '@nestjs/testing';
import { YoomoneyService } from './yoomoney.service';

describe('YoomoneyService', () => {
  let service: YoomoneyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YoomoneyService],
    }).compile();

    service = module.get<YoomoneyService>(YoomoneyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
