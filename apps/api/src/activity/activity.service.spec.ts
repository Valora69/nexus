import { Test, TestingModule } from '@nestjs/testing';
import { ActivityService } from './activity.service';

describe('ActivityService', () => {
  let service: ActivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivityService],
    })
      // Auto-mock every unresolved dependency (Prisma, JWT, event emitter…)
      .useMocker(() => ({}))
      .compile();

    service = module.get<ActivityService>(ActivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
