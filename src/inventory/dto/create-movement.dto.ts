import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { MovementType } from '@prisma/client';

export class CreateMovementDto {
  @IsEnum(MovementType)
  @IsNotEmpty()
  type: MovementType;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  lotId?: string;

  @IsInt()
  @IsNotEmpty()
  quantity: number; // For RECEIPTS, SHIPMENTS, TRANSFERS, this is the quantity to move (must be > 0). For ADJUSTMENT, can be positive (add) or negative (sub).

  @IsString()
  @IsOptional()
  fromLocationId?: string;

  @IsString()
  @IsOptional()
  toLocationId?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsNotEmpty()
  authorizedById: string;
}
