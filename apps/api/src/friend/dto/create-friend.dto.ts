import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendFriendRequestDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class AcceptRequestByTokenDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}
