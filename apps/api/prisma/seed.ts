import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting seed process...');

    // Create users
    const user1 = await prisma.user.create({
      data: {
        name: "James Manon-og",
        email: "james@example.com",
        password: await hash('password321', 10)
      }
    });
    console.log('Created user1:', user1.name);

    const user2 = await prisma.user.create({
      data: {
        name: "Adolfo Cedric Sarillo",
        email: "adolfo@example.com",
        password: await hash('password123', 10)
      }
    });
    console.log('Created user2:', user2.name);

    // Create first group
    const group1 = await prisma.group.create({
      data: {
        name: "Palawan Trip",
        description: "2 weeks summer vacation",
        createdByUserId: user1.id
      }
    });
    console.log('Created group1:', group1.name);

    // Add members to first group one by one
    await prisma.groupMember.create({
      data: {
        groupId: group1.id,
        userId: user1.id
      }
    });
    console.log('Added user1 to group1');

    await prisma.groupMember.create({
      data: {
        groupId: group1.id,
        userId: user2.id
      }
    });
    console.log('Added user2 to group1');

    // Create payment
    const payment1 = await prisma.payment.create({
      data: {
        amountPaid: 1500.00,
        paymentProof: "palawan_hotel_receipt.jpg",
      }
    });
    console.log('Created payment record');

    // Create expense
    const expense1 = await prisma.expense.create({
      data: {
        name: "Hotel Booking",
        totalAmount: 1500.00,
        groupId: group1.id,
        payerId: user1.id,
        payeeId: user2.id,
        date: new Date(),
        notes: "3 nights hotel accommodation",
        paymentId: payment1.id,
      }
    });
    console.log('Created expense record:', expense1.name);

    // Create activity
    // await prisma.activity.create({
    //   data: {
    //     groupId: group1.id,
    //     createdByUserId: user1.id,
    //   }
    // });
    console.log('Created activity record');

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