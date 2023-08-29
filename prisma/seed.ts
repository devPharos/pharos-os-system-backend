import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
const prisma = new PrismaClient()
async function main() {
  const hashedPassword = await hash('12345678', 8)

  const group1 = await prisma.userGroups.upsert({
    where: { id: 1 },
    update: {},
    create: {
      group: 'ADMIN',
    },
  })
  const group2 = await prisma.userGroups.upsert({
    where: { id: 2 },
    update: {},
    create: {
      group: 'CLIENT',
    },
  })
  const group3 = await prisma.userGroups.upsert({
    where: { id: 3 },
    update: {},
    create: {
      group: 'COLLABORATOR',
    },
  })
  const pharos = await prisma.company.upsert({
    where: { cnpj: '123456788' },
    update: {},
    create: {
      name: 'Pharos IT',
      cnpj: '123456788',
      email: 'pharosit@email.com',
      phone: '11 12345677',
      country: 'Brasil',
      state: 'São Paulo',
      city: 'São Paulo',
      neighborhood: 'Bairro',
      address: 'Rua teste',
      number: '123',
      complement: 'complemento',
      cep: '12345-77',
    },
  })
  const pharosUser = await prisma.user.upsert({
    where: { email: 'email@pharosit.com' },
    update: {},
    create: {
      email: 'email@pharosit.com',
      password: hashedPassword,
      group: {
        connect: { id: 1 },
      },
      company: {
        connect: { cnpj: '123456788' },
      },
    },
  })
  const pharosCollaborator = await prisma.collaborator.upsert({
    where: { cnpj: '12349679878' },
    update: {},
    create: {
      name: 'Teste 1',
      lastName: 'Sobrenome 2',
      cnpj: '12349679878',
      phone: '11 12345677',
      country: 'Brasil',
      state: 'São Paulo',
      city: 'São Paulo',
      neighborhood: 'Bairro',
      address: 'Rua teste',
      number: '123',
      complement: 'complemento',
      cep: '12345-77',
      bank: 'Banco',
      agency: '124323',
      agencyDigit: '1',
      account: '1232432',
      accountDigit: '3',
      pixKey: '12334555',
      company: {
        connect: { cnpj: '123456788' },
      },
      user: {
        connect: { email: 'email@pharosit.com' },
      },
    },
  })

  console.log(group1)
  console.log(group2)
  console.log(group3)
  console.log(pharos)
  console.log(pharosUser)
  console.log(pharosCollaborator)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
