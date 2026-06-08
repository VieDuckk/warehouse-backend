import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLotDto {
  @IsString()
  @IsNotEmpty()
  lotNumber: string;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @IsDateString()
  @IsOptional()
  manufactureDate?: string;
}
