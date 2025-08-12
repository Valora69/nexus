import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ExpenseModule } from './expense/expense.module';
import { ParticipantModule } from './participant/participant.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { GroupModule } from './group/group.module';
import { GroupMemberModule } from './group-member/group-member.module';

@Module({
  imports: [
    UserModule,
    ExpenseModule,
    ParticipantModule,
    PaymentModule,
    PrismaModule,
    AuthModule,
    GroupModule,
    GroupMemberModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
