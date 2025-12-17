import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('正在清除所有数据...')
  
  try {
    // 1. Delete dependent data first
    console.log('Deleting Transactions...')
    await prisma.transaction.deleteMany()
    
    console.log('Deleting Budgets...')
    await prisma.budget.deleteMany()
    
    console.log('Deleting Assets...')
    await prisma.asset.deleteMany()
    
    console.log('Deleting Accounts...')
    // Accounts might have self-relations (parent/child), but deleteMany handles it if no foreign key constraints block it.
    // In SQLite/Prisma, deleteMany usually works fine unless there are strict constraints.
    await prisma.account.deleteMany()
    
    console.log('Deleting System Settings...')
    await prisma.systemSetting.deleteMany()
    
    console.log('Deleting Daily Love Quotes...')
    await prisma.dailyLoveQuote.deleteMany()
    
    console.log('Deleting Categories...')
    await prisma.category.deleteMany()
    
    console.log('Deleting Users...')
    await prisma.user.deleteMany()
    
    console.log('Deleting Families...')
    await prisma.family.deleteMany()
    
    console.log('所有数据已清除。')
  } catch (error) {
    console.error('清除数据时出错:', error)
  }
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
