import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const hashedPassword = await hash("12345678", 8);

  await prisma.user.upsert({
    where: { email: "gabriela@pharosit.com.br" },
    update: {},
    create: {
      email: "email@pharosit.com",
      password: hashedPassword,
      group: {
        connect: { id: 1 },
      },
      company: {
        connect: { cnpj: "123456788" },
      },
    },
  });

  await prisma.collaborator.upsert({
    where: { cnpj: "40606220879" },
    update: {},
    create: {
      name: "Gabriela",
      lastName: "Batista",
      cnpj: "40606220879",
      phone: "11989347085",
      country: "Brasil",
      state: "SP",
      city: "Guarulhos",
      neighborhood: "Jardim Itapoa",
      address: "Rua Miracema",
      number: "364",
      complement: "Casa 1",
      cep: "07124-520",
      bank: "0260 Nu Pagamentos",
      agency: "0001",
      agencyDigit: "",
      account: "39096532-7",
      accountDigit: "",
      pixKey: "",
      company: {
        connect: { cnpj: "123456788" },
      },
      user: {
        connect: { email: "gabriela@pharosit.com.br" },
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
