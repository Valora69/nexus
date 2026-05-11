import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req
} from '@nestjs/common';
import { GroupMemberService } from './group-member.service';
import { CreateGroupMemberDto } from './dto/create-group-member.dto';
import { UpdateGroupMemberDto } from './dto/update-group-member.dto';
import { ThrottleWrite } from 'src/common/throttle.decorators';

@Controller('group-member')
export class GroupMemberController {
  constructor(private readonly groupMemberService: GroupMemberService) {}

  @ThrottleWrite()
  @Post()
  create(@Body() createGroupMemberDto: CreateGroupMemberDto, @Req() req ) {
    return this.groupMemberService.create(createGroupMemberDto, req.user.sub);
  }

  @Get()
  findAll() {
    return this.groupMemberService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupMemberService.findOne(id);
  }

  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateGroupMemberDto: UpdateGroupMemberDto,
  // ) {
  //   return this.groupMemberService.update(id, updateGroupMemberDto);
  // }

  @ThrottleWrite()
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.groupMemberService.remove(id, req.user.sub);
  }
}
