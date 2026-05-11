import { IsNotEmpty, IsString } from 'class-validator';

export class QuickCaptureDto {
  @IsNotEmpty()
  @IsString()
  input: string;
}
