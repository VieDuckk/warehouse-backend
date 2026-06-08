import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { CreateZoneDto } from './dto/create-zone.dto';
import { WarehousesService } from './warehouses.service';

@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  createWarehouse(@Body() createWarehouseDto: CreateWarehouseDto) {
    return this.warehousesService.createWarehouse(createWarehouseDto);
  }

  @Get()
  findAllWarehouses() {
    return this.warehousesService.findAllWarehouses();
  }

  @Get('locations')
  findAllLocations() {
    return this.warehousesService.findAllLocations();
  }

  @Get('locations/:id')
  findLocationById(@Param('id') id: string) {
    return this.warehousesService.findLocationById(id);
  }

  @Get(':id')
  findOneWarehouse(@Param('id') id: string) {
    return this.warehousesService.findOneWarehouse(id);
  }

  @Post(':id/zones')
  createZone(@Param('id') id: string, @Body() createZoneDto: CreateZoneDto) {
    return this.warehousesService.createZone(id, createZoneDto);
  }

  @Post('zones/:zoneId/locations')
  createLocation(
    @Param('zoneId') zoneId: string,
    @Body() createLocationDto: CreateLocationDto,
  ) {
    return this.warehousesService.createLocation(zoneId, createLocationDto);
  }
}
