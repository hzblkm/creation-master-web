import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { ProjectsService } from './projects.service'

@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  list() {
    return this.service.findAll()
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Post()
  create(
    @Body()
    body: {
      name: string
      type: string
      status?: string
    },
  ) {
    return this.service.create(body)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; type?: string; status?: string },
  ) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}