import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('正在清理旧数据...')
  // Clean up database
  await prisma.transaction.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.account.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()
  
  console.log('旧数据清理完成')

  const hashedPassword = await bcrypt.hash('password', 10)

  // Create Admin user - Wang Sicong
  console.log('正在创建管理员：王思聪...')
  const admin = await prisma.user.create({
    data: {
      email: 'wsc@wanda.com',
      name: '王思聪',
      password: hashedPassword,
      role: 'ADMIN',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=WangSicong&style=circle&top=shortHair&hairColor=black&facialHair=beardLight',
    },
  })

  console.log('管理员创建成功:', admin.name)

  // Create Luxury Expense Categories
  const expenseCategories = [
    { name: '私人飞机', type: 'EXPENSE', icon: 'plane' },
    { name: '豪车维护', type: 'EXPENSE', icon: 'car' },
    { name: '游艇派对', type: 'EXPENSE', icon: 'ship' },
    { name: '电竞投资', type: 'EXPENSE', icon: 'gamepad-2' },
    { name: '奢侈品', type: 'EXPENSE', icon: 'shopping-bag' },
    { name: '高级餐饮', type: 'EXPENSE', icon: 'utensils' },
    { name: '夜店消费', type: 'EXPENSE', icon: 'wine' },
    { name: '宠物开销', type: 'EXPENSE', icon: 'dog' }, // For Coco
  ]

  for (const cat of expenseCategories) {
    await prisma.category.create({ data: cat })
  }

  // Create Income Categories
  const incomeCategories = [
    { name: '家族分红', type: 'INCOME', icon: 'landmark' },
    { name: '投资回报', type: 'INCOME', icon: 'trending-up' },
    { name: '直播收益', type: 'INCOME', icon: 'video' },
  ]

  for (const cat of incomeCategories) {
    await prisma.category.create({ data: cat })
  }

  // Create Accounts with "Small Goals"
  console.log('正在创建资金账户...')
  const accounts = [
    { name: '黑卡主账户', type: 'BANK', balance: 500000000.00, icon: 'credit-card' }, // 5亿
    { name: '零花钱', type: 'CASH', balance: 2000000.00, icon: 'wallet' }, // 200万
    { name: '普思资本', type: 'INVESTMENT', balance: 2000000000.00, icon: 'briefcase' }, // 20亿
  ]

  for (const acc of accounts) {
    await prisma.account.create({
      data: {
        ...acc,
        userId: admin.id
      }
    })
  }

  // Create Luxury Assets
  console.log('正在创建资产...')
  const assets = [
    { name: '万达电影', type: 'CN_STOCK', symbol: '002739', quantity: 1000000, costPrice: 12.50, marketPrice: 13.80 },
    { name: 'IG电子竞技俱乐部', type: 'OTHER', symbol: 'IG', quantity: 1, costPrice: 50000000.00, marketPrice: 500000000.00 },
    { name: '湾流G550私人飞机', type: 'OTHER', symbol: 'JET', quantity: 1, costPrice: 300000000.00, marketPrice: 280000000.00 },
    { name: '劳斯莱斯幻影', type: 'OTHER', symbol: 'RR', quantity: 1, costPrice: 12000000.00, marketPrice: 10000000.00 },
    { name: '上海半岛酒店公寓', type: 'REAL_ESTATE', symbol: 'SH-APT', quantity: 1, costPrice: 80000000.00, marketPrice: 120000000.00 },
  ]

  for (const asset of assets) {
    await prisma.asset.create({
      data: {
        ...asset,
        userId: admin.id
      }
    })
  }

  // Create some sample transactions
  console.log('正在生成近期消费记录...')
  const categories = await prisma.category.findMany()
  const userAccounts = await prisma.account.findMany({ where: { userId: admin.id } })
  
  const partyCategory = categories.find(c => c.name === '游艇派对')
  const carCategory = categories.find(c => c.name === '豪车维护')
  const petCategory = categories.find(c => c.name === '宠物开销')
  const blackCard = userAccounts.find(a => a.name === '黑卡主账户')

  if (blackCard && partyCategory && carCategory && petCategory) {
    await prisma.transaction.createMany({
      data: [
        {
          amount: 2000000,
          type: 'EXPENSE',
          date: new Date(),
          description: '三亚生日派对包场',
          categoryId: partyCategory.id,
          accountId: blackCard.id,
          userId: admin.id
        },
        {
          amount: 500000,
          type: 'EXPENSE',
          date: new Date(Date.now() - 86400000 * 2), // 2 days ago
          description: '法拉利保养',
          categoryId: carCategory.id,
          accountId: blackCard.id,
          userId: admin.id
        },
        {
          amount: 20000,
          type: 'EXPENSE',
          date: new Date(Date.now() - 86400000 * 5), // 5 days ago
          description: '给王可可买进口狗粮',
          categoryId: petCategory.id,
          accountId: blackCard.id,
          userId: admin.id
        }
      ]
    })
  }

  console.log('数据生成完成！')
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
