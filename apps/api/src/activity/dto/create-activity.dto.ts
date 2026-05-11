import { ApiProperty } from '@nestjs/swagger';
import { ActivityNameEnum, ActivityOnEnum } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({ description: 'Name of the activity', enum: ActivityNameEnum })
  @IsEnum(ActivityNameEnum)
  activityName: ActivityNameEnum;

  @ApiProperty({ description: 'Type of activity', enum: ActivityOnEnum })
  @IsEnum(ActivityOnEnum)
  activityOn: ActivityOnEnum;

  @ApiProperty({
    description: 'ID of the group associated with the activity',
  })
  @IsString()
  groupId: string;

  @ApiProperty()
  @IsString()
  createdByUserId: string;
}
