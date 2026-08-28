import bcrypt from 'bcrypt'
import { prisma } from '../src/lib/prisma.js'

const main = async (): Promise<void> => {
  const password = await bcrypt.hash('admin', 10)

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password, role: 'ADMIN' },
    create: { username: 'admin', password, role: 'ADMIN' },
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
