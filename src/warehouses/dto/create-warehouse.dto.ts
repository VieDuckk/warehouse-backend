import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  address?: string;
}
