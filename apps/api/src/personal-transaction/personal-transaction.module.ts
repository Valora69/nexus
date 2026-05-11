import { Module } from '@nestjs/common';
import { PersonalTransactionService } from './personal-transaction.service';
import { PersonalTransactionController } from './personal-transaction.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PersonalTransactionController],
  providers: [PersonalTransactionService],
  exports: [PersonalTransactionService],
})
export class PersonalTransactionModule {}
