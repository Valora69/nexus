import { Test, TestingModule } from '@nestjs/testing';
import { ActivityController } from './activity.controller';

describe('ActivityController', () => {
  let controller: ActivityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityController],
    })
      // Auto-mock every unresolved dependency (Prisma, JWT, event emitter…)
      .useMocker(() => ({}))
      .compile();

    controller = module.get<ActivityController>(ActivityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
