import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ReceiveItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  lotId?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @IsString()
  locationId: string;
}

export class ReceiveInboundOrderDto {
  @IsNotEmpty()
  @IsString()
  authorizedById: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items: ReceiveItemDto[];
}
