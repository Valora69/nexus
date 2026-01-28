import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  create(@Body() createGroupDto: CreateGroupDto, @Req() req) {
    return this.groupService.create(createGroupDto, req.user.sub);
  }

  @Get()
  findAll(@Req() req) {
    return this.groupService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto, @Req() req) {
    return this.groupService.update(id, updateGroupDto, req.user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.groupService.remove(id, req.user.sub);
  }
}
