import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { CreateZoneDto } from './dto/create-zone.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  async createWarehouse(createWarehouseDto: CreateWarehouseDto) {
    const existingCode = await this.prisma.warehouse.findFirst({
      where: {
        OR: [
          { name: createWarehouseDto.name },
          { code: createWarehouseDto.code },
        ],
      },
    });

    if (existingCode) {
      throw new ConflictException(
        'Warehouse with this name or code already exists',
      );
    }

    return this.prisma.warehouse.create({
      data: createWarehouseDto,
    });
  }

  async findAllWarehouses() {
    return this.prisma.warehouse.findMany({
      include: {
        zones: {
          include: {
            locations: true,
          },
        },
      },
    });
  }

  async findOneWarehouse(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        zones: {
          include: {
            locations: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse;
  }

  async createZone(warehouseId: string, createZoneDto: CreateZoneDto) {
    // Validate warehouse exists
    await this.findOneWarehouse(warehouseId);

    const existingZone = await this.prisma.zone.findFirst({
      where: {
        warehouseId,
        code: createZoneDto.code,
      },
    });

    if (existingZone) {
      throw new ConflictException(
        `Zone with code ${createZoneDto.code} already exists in this warehouse`,
      );
    }

    return this.prisma.zone.create({
      data: {
        ...createZoneDto,
        warehouseId,
      },
    });
  }

  async createLocation(zoneId: string, createLocationDto: CreateLocationDto) {
    // Validate zone exists
    const zone = await this.prisma.zone.findUnique({
      where: { id: zoneId },
    });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${zoneId} not found`);
    }

    const existingLocation = await this.prisma.location.findUnique({
      where: { code: createLocationDto.code },
    });

    if (existingLocation) {
      throw new ConflictException(
        `Location with code ${createLocationDto.code} already exists`,
      );
    }

    return this.prisma.location.create({
      data: {
        ...createLocationDto,
        zoneId,
      },
    });
  }

  async findLocationById(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: {
        zone: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return location;
  }

  async findAllLocations() {
    return this.prisma.location.findMany({
      include: {
        zone: {
          include: {
            warehouse: true,
          },
        },
      },
    });
  }
}
