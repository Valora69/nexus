import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user1 = await prisma.user.create({
    data: {
      id: '3137c81d-bb8b-4a87-bd85-4fd80adafd69',
      name: 'Sid',
      email: 'siddigamon@gmail.com',
      password: '$2b$10$7mz2v7ZhFCauy8NQwzrfb.7l6lWYlxyi9ky.HkYiMQ3aBKp9Ui.Sm',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      id: '9732538a-3fa9-44d5-a09d-0317495914b2',
      name: 'Miggy',
      email: 'miggyalino@gmail.com',
      password: '$2b$10$7mz2v7ZhFCauy8NQwzrfb.7l6lWYlxyi9ky.HkYiMQ3aBKp9Ui.Sm',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      id: '597f3baf-47d0-4984-bb0f-4123ffc18d71',
      name: 'James',
      email: 'jamesmanonog@gmail.com',
      password: '$2b$10$7mz2v7ZhFCauy8NQwzrfb.7l6lWYlxyi9ky.HkYiMQ3aBKp9Ui.Sm',
    },
  });

  const user4 = await prisma.user.create({
    data: {
      id: 'a3458cb6-98f7-44e2-8a1a-a02a02e072f2',
      name: 'Job',
      email: 'jobmegrino@gmail.com',
      password: '$2b$10$7mz2v7ZhFCauy8NQwzrfb.7l6lWYlxyi9ky.HkYiMQ3aBKp9Ui.Sm',
    },
  });

  const user5 = await prisma.user.create({
    data: {
      id: '62a5225e-90c1-4775-9631-e069243f3979',
      name: 'Ced',
      email: 'cedsarillo@gmail.com',
      password: '$2b$10$7mz2v7ZhFCauy8NQwzrfb.7l6lWYlxyi9ky.HkYiMQ3aBKp9Ui.Sm',
    },
  });

  const user6 = await prisma.user.create({
    data: {
      id: 'db597c7b-cb1b-4664-a754-8d0f244fb99e',
      name: 'Glenn',
      email: 'glennfabul@gmail.com',
      password: '$2b$10$7mz2v7ZhFCauy8NQwzrfb.7l6lWYlxyi9ky.HkYiMQ3aBKp9Ui.Sm',
    },
  });

  const friendsGroup = await prisma.group.create({
    data: {
      id: 'f8e9d7c6-b5a4-9382-8172-6a5b4c3d2e1f',
      name: 'Friends Group',
      description: 'Main friend group for shared expenses',
    },
  });

  await prisma.groupMember.createMany({
    data: [
      { groupId: friendsGroup.id, userId: user1.id },
      { groupId: friendsGroup.id, userId: user2.id },
      { groupId: friendsGroup.id, userId: user3.id },
      { groupId: friendsGroup.id, userId: user4.id },
      { groupId: friendsGroup.id, userId: user5.id },
      { groupId: friendsGroup.id, userId: user6.id },
    ],
  });

  const expense1 = await prisma.expense.create({
    data: {
      id: 'dc471030-9809-486c-8c19-80bc49df88fa',
      name: 'Bawud',
      totalAmount: 2155,
      groupId: friendsGroup.id,
      paidById: user3.id,
      date: new Date('2025-07-25T19:30:00.000Z'),
      notes: 'Good shit',
    },
  });

  const participant4_6 = await prisma.participant.create({
    data: {
      id: 'ab59440b-359c-45bb-9c45-2022167adf22',
      expenseId: expense1.id,
      userId: user6.id,
      shareAmount: 359.17,
      isSettled: false,
    },
  });

  const participant4_1 = await prisma.participant.create({
    data: {
      id: 'd4ab3753-8806-4c4f-b4dd-18986582d975',
      expenseId: expense1.id,
      userId: user1.id,
      shareAmount: 359.17,
      isSettled: false,
    },
  });

  const participant4_5 = await prisma.participant.create({
    data: {
      id: '43623c3e-28b3-4c92-89de-57a1ecff28f8',
      expenseId: expense1.id,
      userId: user5.id,
      shareAmount: 359.17,
      isSettled: false,
    },
  });

  const participant4_4 = await prisma.participant.create({
    data: {
      id: '5e3d2008-f8df-4ece-bd5b-831626b15343',
      expenseId: expense1.id,
      userId: user4.id,
      shareAmount: 359.17,
      isSettled: false,
    },
  });

  const participant4_2 = await prisma.participant.create({
    data: {
      id: 'b9bb0904-6dce-4111-a92f-eef96fdf6b84',
      expenseId: expense1.id,
      userId: user2.id,
      shareAmount: 359.15,
      isSettled: false,
    },
  });

  const participant4_3 = await prisma.participant.create({
    data: {
      id: '5ba7f117-fc7c-4290-a002-1f6b11c9f1f6',
      expenseId: expense1.id,
      userId: user3.id,
      shareAmount: 359.17,
      isSettled: true,
      settledAt: new Date('2025-07-25T22:14:00.000Z'),
    },
  });

  await prisma.payment.create({
    data: {
      participantId: participant4_3.id,
      amountPaid: 359.17,
      paidAt: new Date('2025-07-25T22:14:00.000Z'),
    },
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
