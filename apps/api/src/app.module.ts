import { Module } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ExpenseModule } from './expense/expense.module';
import { ExpenseSplitModule } from './expense-split/expense-split.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { GroupModule } from './group/group.module';
import { GroupMemberModule } from './group-member/group-member.module';
import { ActivityModule } from './activity/activity.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AuthModule } from './auth/auth.module';
import { FriendModule } from './friend/friend.module';
import { EmailModule } from './email/email.module';
import { PersonalTransactionModule } from './personal-transaction/personal-transaction.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,  // 1 minute window
        limit: 60,    // 60 requests per window (general reads)
      },
      {
        name: 'write',
        ttl: 60_000,
        limit: 30,    // 30 mutations per minute
      },
      {
        name: 'auth',
        ttl: 60_000,
        limit: 10,    // 10 auth attempts per minute
      },
    ]),
    UserModule,
    ExpenseModule,
    ExpenseSplitModule,
    PaymentModule,
    PrismaModule,
    AuthModule,
    GroupModule,
    GroupMemberModule,
    ActivityModule,
    EventEmitterModule.forRoot(),
    FriendModule,
    EmailModule,
    PersonalTransactionModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Reflector,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
