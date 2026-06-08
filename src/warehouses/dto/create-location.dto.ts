import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  code: string; // Unique, e.g., WH1-A1-S2-B3

  @IsString()
  @IsOptional()
  aisle?: string;

  @IsString()
  @IsOptional()
  shelf?: string;

  @IsString()
  @IsOptional()
  bin?: string;
}
