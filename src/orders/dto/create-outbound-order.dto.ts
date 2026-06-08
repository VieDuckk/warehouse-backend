import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OutboundOrderItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  qtyRequested: number;
}

export class CreateOutboundOrderDto {
  @IsNotEmpty()
  @IsString()
  orderNumber: string;

  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsNotEmpty()
  @IsString()
  creatorId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutboundOrderItemDto)
  items: OutboundOrderItemDto[];
}
