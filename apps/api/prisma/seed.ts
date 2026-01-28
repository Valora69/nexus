import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🌱 Starting database seeding...');

  // rest of your seed code...
  // Clear existing data (optional - be careful in production!)
  await prisma.activity.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: hashedPassword,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      password: hashedPassword,
    },
  });

  console.log('✅ Created users');

  // Create Groups
  const group1 = await prisma.group.create({
    data: {
      name: 'Weekend Trip',
      description: 'Our weekend getaway expenses',
      createdByUserId: user1.id,
    },
  });

  const group2 = await prisma.group.create({
    data: {
      name: 'Office Lunch',
      description: 'Team lunch expenses',
      createdByUserId: user2.id,
    },
  });

  console.log('✅ Created groups');

  // Create Group Members
  await prisma.groupMember.createMany({
    data: [
      { groupId: group1.id, userId: user1.id },
      { groupId: group1.id, userId: user2.id },
      { groupId: group1.id, userId: user3.id },
      { groupId: group2.id, userId: user1.id },
      { groupId: group2.id, userId: user2.id },
    ],
  });

  console.log('✅ Created group members');

  // Create Expenses
  const expense1 = await prisma.expense.create({
    data: {
      name: 'Hotel Booking',
      totalAmount: 300.0,
      groupId: group1.id,
      payerId: user1.id,
      payeeId: user2.id,
      date: new Date('2024-01-15'),
      notes: 'Split hotel cost',
    },
  });

  const expense2 = await prisma.expense.create({
    data: {
      name: 'Dinner',
      totalAmount: 150.0,
      groupId: group1.id,
      payerId: user2.id,
      payeeId: user3.id,
      date: new Date('2024-01-16'),
      notes: 'Restaurant bill',
    },
  });

  const expense3 = await prisma.expense.create({
    data: {
      name: 'Pizza Order',
      totalAmount: 45.0,
      groupId: group2.id,
      payerId: user1.id,
      payeeId: user2.id,
      date: new Date('2024-01-20'),
    },
  });

  console.log('✅ Created expenses');

  // Create Payments
  await prisma.payment.create({
    data: {
      amountPaid: 150.0,
      paymentProof: 'payment-receipt-001.pdf',
      paidAt: new Date('2024-01-17'),
      expenseId: expense1.id,
    },
  });

  await prisma.payment.create({
    data: {
      amountPaid: 75.0,
      paymentProof: 'payment-receipt-002.pdf',
      paidAt: new Date('2024-01-18'),
      expenseId: expense2.id,
    },
  });

  console.log('✅ Created payments');

  // Create Activities
  await prisma.activity.createMany({
    data: [
      {
        groupId: group1.id,
        createdByUserId: user1.id,
      },
      {
        groupId: group1.id,
        createdByUserId: user2.id,
      },
      {
        groupId: group2.id,
        createdByUserId: user1.id,
      },
    ],
  });

  console.log('✅ Created activities');

  console.log('🎉 Database seeding completed successfully!');
  console.log(`
📊 Summary:
- Users: 3 (john@example.com, jane@example.com, bob@example.com)
- Password for all users: password123
- Groups: 2
- Expenses: 3
- Payments: 2
- Activities: 3
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
