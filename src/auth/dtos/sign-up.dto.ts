import { IsDefined, IsEmail, IsOptional, IsString } from 'class-validator';

export class SignUpDto {
  @IsString()
  @IsDefined()
  name: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @IsDefined()
  @IsString()
  password?: string;

  @IsString()
  @IsOptional()
  facebookId?: string;

  @IsString()
  @IsOptional()
  googleId?: string;

  @IsString()
  @IsOptional()
  outlookId?: string;
}
