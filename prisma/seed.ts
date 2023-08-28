import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const groups = await prisma.userGroups.createMany({
    data: [
      {
        group: 'ADMIN'
      },
      {
        group: 'COLLABORATOR'
      },
      {
        group: 'CLIENT'
      }
    ]
  })
  const pharos = await prisma.company.upsert({
    where: {cnpj: '123456788'},
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
    }})
  const pharosUser = await prisma.user.create({
    data: {
      email: 'email@pharosit.com',
      password: '1234567',
      group: {
        connect: {id: 1}
      },
      company: {
        connect: { cnpj: '123456788' }
      }
    }
  })
  const pharosCollaborator = await prisma.collaborator.create({
    data: {
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
        connect: { cnpj: '123456788' }
      },
      user: {
        connect: { email: 'email@pharosit.com' }
      }
    }
  })

  console.log(groups)
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