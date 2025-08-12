import { IsNotEmpty, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export class CreateGroupMemberDto {
  @IsNotEmpty()
  @IsUUID()
  groupId: UUID;

  @IsNotEmpty()
  @IsUUID()
  userId: UUID;
}
