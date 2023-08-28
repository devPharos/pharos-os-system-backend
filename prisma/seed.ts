import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
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

  console.log(pharos)
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