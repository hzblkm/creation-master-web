import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { TestController } from './test.controller'

@Module({
  imports: [PrismaModule],
  controllers: [TestController],
})
export class TestModule {}