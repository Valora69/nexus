import { PrismaClient } from "@prisma/client";
import {hash} from "bcrypt"
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting seed process...');

    const user1 = await prisma.user.create({
      data: {
          name: "James Manon-og",
          email: "james@example.com",
          password: await hash ('password321', 10)
      }
    });
    console.log('Created user1:', user1.name);

    const user2 = await prisma.user.create({
      data: {
          name: "Adolfo Cedric Sarillo",
          email: "adolfo@example.com",
          password: await hash ('password123', 10)
      }
    });
    console.log('Created user2:', user2.name);

    const group = await prisma.group.create({
      data: {
          name: "Palawan",
          description: "2 weeks trip"
      }
    });
    console.log('Created group:', group.name);

    const member1 = await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user1.id,
      }
    });
    console.log('Added member1 to group');

    const member2 = await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user2.id,
      }
    });
    console.log('Added member2 to group');

    const payment = await prisma.payment.create({
      data: {
        amountPaid: 100.00,
        paymentProof: "receipt.jpg",
      },
    });
    console.log('Created payment record');

    const expense = await prisma.expense.create({
      data: {
        name: "Dinner",
        totalAmount: 100.00,
        groupId: group.id,
        userId: user1.id,
        date: new Date(),
        notes: "Group dinner at mountain resort",
        paymentId: payment.id,
      },
    });
    console.log('Created expense record:', expense.name);

    console.log('✅ Seed data created successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Failed to seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔚 Database connection closed');
  });