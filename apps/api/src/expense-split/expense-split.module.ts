import { Module } from '@nestjs/common';
import { ExpenseSplitService } from './expense-split.service';
import { ExpenseSplitController } from './expense-split.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExpenseSplitController],
  providers: [ExpenseSplitService],
  exports: [ExpenseSplitService],
})
export class ExpenseSplitModule {}
