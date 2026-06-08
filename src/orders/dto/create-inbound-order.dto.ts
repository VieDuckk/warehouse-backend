import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class InboundOrderItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  qtyExpected: number;
}

export class CreateInboundOrderDto {
  @IsNotEmpty()
  @IsString()
  orderNumber: string;

  @IsNotEmpty()
  @IsString()
  supplierId: string;

  @IsNotEmpty()
  @IsString()
  creatorId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InboundOrderItemDto)
  items: InboundOrderItemDto[];
}
