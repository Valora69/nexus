import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import {
  SendFriendRequestDto,
  AcceptRequestByTokenDto,
} from './dto/create-friend.dto';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  // Send a friend request
  @Post('request')
  sendRequest(@Body() dto: SendFriendRequestDto, @Req() req) {
    return this.friendService.sendFriendRequest(req.user.sub, dto.email);
  }

  // Get all pending requests received
  @Get('requests')
  getPendingRequests(@Req() req) {
    return this.friendService.getPendingRequests(req.user.sub);
  }

  // Get all sent requests
  @Get('requests/sent')
  getSentRequests(@Req() req) {
    return this.friendService.getSentRequests(req.user.sub);
  }

  // Accept a friend request by ID
  @Post('requests/:id/accept')
  acceptRequest(@Param('id') id: string, @Req() req) {
    return this.friendService.acceptRequest(req.user.sub, id);
  }

  // Accept a friend request by token (from email link)
  @Post('requests/accept-by-token')
  acceptRequestByToken(@Body() dto: AcceptRequestByTokenDto, @Req() req) {
    return this.friendService.acceptRequestByToken(req.user.sub, dto.token);
  }

  // Decline a friend request
  @Post('requests/:id/decline')
  declineRequest(@Param('id') id: string, @Req() req) {
    return this.friendService.declineRequest(req.user.sub, id);
  }

  // Get all friends
  @Get()
  getFriends(@Req() req) {
    return this.friendService.getFriends(req.user.sub);
  }

  // Remove a friend
  @Delete(':id')
  removeFriend(@Param('id') id: string, @Req() req) {
    return this.friendService.removeFriend(req.user.sub, id);
  }
}
