import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.project.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async findOne(id: string) {
    const item = await this.prisma.project.findUnique({ where: { id } })
    if (!item) throw new NotFoundException('Project not found')
    return item
  }

  create(data: { name: string; type: string; status?: string }) {
    return this.prisma.project.create({ data })
  }

  async update(id: string, data: { name?: string; type?: string; status?: string }) {
    await this.findOne(id)
    return this.prisma.project.update({ where: { id }, data })
  }

  async remove(id: string) {
    await this.findOne(id)
    await this.prisma.setting.deleteMany({ where: { projectId: id } })
    await this.prisma.chapter.deleteMany({ where: { projectId: id } })
    await this.prisma.projectFact.deleteMany({ where: { projectId: id } })
    await this.prisma.foreshadowing.deleteMany({ where: { projectId: id } })
    return this.prisma.project.delete({ where: { id } })
  }
}