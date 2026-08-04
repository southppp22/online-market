import { Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';

class AgreementsDto {
  @IsBoolean()
  @Equals(true)
  termsOfService: boolean;

  @IsBoolean()
  @Equals(true)
  privacyPolicy: boolean;
}

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @Matches(/^01[0-9]{8,9}$/)
  phone: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => AgreementsDto)
  agreements: AgreementsDto;
}
