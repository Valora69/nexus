import { PrismaClient } from "@prisma/client";
import {hash} from "bcrypt"
const prisma = new PrismaClient();

async function main() {
  const user1 = await prisma.user.create({
    data: {
        name: "James Manon-og",
        email: "james@example.com",
        password: await hash ('password321', 10)
    }
  })

  const user2 = await prisma.user.create({
    data: {
        name: "Adolfo Cedric Sarillo",
        email: "adolfo@example.com",
        password: await hash ('password123', 10)
    }
  })

  const group = await prisma.group.create({
    data: {
        name: "Palawan",
        description: "2 weeks trip"
    }
  })

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: user1.id,
    }
  });

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: user2.id,
    }
  });

  const payment = await prisma.payment.create({
    data: {
      amountPaid: 100.00,
      paymentProof: "receipt.jpg",
    },
  });

  
  await prisma.expense.create({
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

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
