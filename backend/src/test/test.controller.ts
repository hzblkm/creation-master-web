import { Controller, Post, HttpException, HttpStatus } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Controller('__test__')
export class TestController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('reset')
  async reset() {
    // 仅在非生产环境可用
    if (process.env.NODE_ENV === 'production') {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN)
    }

    // 清理顺序：先子表，后父表
    await this.prisma.foreshadowing.deleteMany()
    await this.prisma.projectFact.deleteMany()
    await this.prisma.chapter.deleteMany()
    await this.prisma.setting.deleteMany()
    await this.prisma.project.deleteMany()

    // 其他独立表
    await this.prisma.appSetting.deleteMany()

    return { ok: true }
  }
}