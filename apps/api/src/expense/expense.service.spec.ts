import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseService } from './expense.service';

describe('ExpenseService', () => {
  let service: ExpenseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpenseService],
    })
      // Auto-mock every unresolved dependency (Prisma, JWT, event emitter…)
      .useMocker(() => ({}))
      .compile();

    service = module.get<ExpenseService>(ExpenseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
