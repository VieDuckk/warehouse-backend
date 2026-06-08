import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateLotDto } from './dto/create-lot.dto';
import { CreateMovementDto } from './dto/create-movement.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAllInventory() {
    return this.inventoryService.findAllInventory();
  }

  @Post('lots')
  createLot(@Body() createLotDto: CreateLotDto) {
    return this.inventoryService.createLot(createLotDto);
  }

  @Get('lots')
  findAllLots() {
    return this.inventoryService.findAllLots();
  }

  @Post('movements')
  createMovement(@Body() createMovementDto: CreateMovementDto) {
    return this.inventoryService.createMovement(createMovementDto);
  }

  @Get('movements')
  findMovements() {
    return this.inventoryService.findMovements();
  }
}
