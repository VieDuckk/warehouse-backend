import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { CreateMovementDto } from './dto/create-movement.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createLot(createLotDto: CreateLotDto) {
    // Check product exists
    const product = await this.prisma.product.findUnique({
      where: { id: createLotDto.productId },
    });
    if (!product) {
      throw new NotFoundException(
        `Product with ID ${createLotDto.productId} not found`,
      );
    }

    // Check unique lotNumber
    const existing = await this.prisma.inventoryLot.findUnique({
      where: { lotNumber: createLotDto.lotNumber },
    });
    if (existing) {
      throw new BadRequestException(
        `Lot number ${createLotDto.lotNumber} already exists`,
      );
    }

    return this.prisma.inventoryLot.create({
      data: {
        lotNumber: createLotDto.lotNumber,
        productId: createLotDto.productId,
        expirationDate: createLotDto.expirationDate
          ? new Date(createLotDto.expirationDate)
          : null,
        manufactureDate: createLotDto.manufactureDate
          ? new Date(createLotDto.manufactureDate)
          : null,
      },
    });
  }

  async findAllLots() {
    return this.prisma.inventoryLot.findMany({
      include: {
        product: true,
      },
    });
  }

  async findAllInventory() {
    return this.prisma.inventory.findMany({
      include: {
        product: true,
        location: {
          include: {
            zone: {
              include: {
                warehouse: true,
              },
            },
          },
        },
        lot: true,
      },
    });
  }

  async findMovements() {
    return this.prisma.inventoryMovement.findMany({
      include: {
        product: true,
        lot: true,
        fromLocation: true,
        toLocation: true,
        authorizedBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Main stock movement core logic.
   * Runs inside a transaction to maintain consistency between Inventory levels and Movements logs.
   */
  async createMovement(
    createMovementDto: CreateMovementDto,
    externalTx?: Prisma.TransactionClient,
  ) {
    const runInTransaction = async (tx: Prisma.TransactionClient) => {
      const {
        type,
        productId,
        lotId,
        quantity,
        fromLocationId,
        toLocationId,
        reason,
        authorizedById,
      } = createMovementDto;

      // 1. Validations
      // Check product
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      // Check lot if provided
      if (lotId) {
        const lot = await tx.inventoryLot.findUnique({ where: { id: lotId } });
        if (!lot) {
          throw new NotFoundException(`Lot with ID ${lotId} not found`);
        }
        if (lot.productId !== productId) {
          throw new BadRequestException(
            `Lot ${lot.lotNumber} does not belong to product ${product.sku}`,
          );
        }
      }

      // Check user
      const user = await tx.user.findUnique({ where: { id: authorizedById } });
      if (!user) {
        throw new NotFoundException(`User with ID ${authorizedById} not found`);
      }

      // Check location helpers
      const validateLocation = async (id: string, name: string) => {
        const loc = await tx.location.findUnique({ where: { id } });
        if (!loc) {
          throw new NotFoundException(
            `${name} location with ID ${id} not found`,
          );
        }
        return loc;
      };

      // 2. Perform Stock Operations
      if (type === 'RECEIPT') {
        if (!toLocationId) {
          throw new BadRequestException(
            'Destination location (toLocationId) is required for RECEIPT',
          );
        }
        if (quantity <= 0) {
          throw new BadRequestException(
            'Quantity must be greater than 0 for RECEIPT',
          );
        }
        await validateLocation(toLocationId, 'Destination');

        // Increase inventory
        await this.addInventory(
          tx,
          productId,
          toLocationId,
          lotId || null,
          quantity,
        );
      } else if (type === 'SHIPMENT') {
        if (!fromLocationId) {
          throw new BadRequestException(
            'Source location (fromLocationId) is required for SHIPMENT',
          );
        }
        if (quantity <= 0) {
          throw new BadRequestException(
            'Quantity must be greater than 0 for SHIPMENT',
          );
        }
        await validateLocation(fromLocationId, 'Source');

        // Decrease inventory
        await this.subtractInventory(
          tx,
          productId,
          fromLocationId,
          lotId || null,
          quantity,
        );
      } else if (type === 'TRANSFER') {
        if (!fromLocationId || !toLocationId) {
          throw new BadRequestException(
            'Both source and destination locations are required for TRANSFER',
          );
        }
        if (fromLocationId === toLocationId) {
          throw new BadRequestException(
            'Source and destination locations must be different',
          );
        }
        if (quantity <= 0) {
          throw new BadRequestException(
            'Quantity must be greater than 0 for TRANSFER',
          );
        }
        await validateLocation(fromLocationId, 'Source');
        await validateLocation(toLocationId, 'Destination');

        // Perform transfer (subtract first, then add)
        await this.subtractInventory(
          tx,
          productId,
          fromLocationId,
          lotId || null,
          quantity,
        );
        await this.addInventory(
          tx,
          productId,
          toLocationId,
          lotId || null,
          quantity,
        );
      } else if (type === 'ADJUSTMENT') {
        if (quantity === 0) {
          throw new BadRequestException('Quantity cannot be 0 for ADJUSTMENT');
        }

        if (quantity > 0) {
          if (!toLocationId) {
            throw new BadRequestException(
              'Destination location (toLocationId) is required for positive ADJUSTMENT',
            );
          }
          await validateLocation(toLocationId, 'Destination');
          await this.addInventory(
            tx,
            productId,
            toLocationId,
            lotId || null,
            quantity,
          );
        } else {
          // Negative adjustment (stock loss/damage)
          if (!fromLocationId) {
            throw new BadRequestException(
              'Source location (fromLocationId) is required for negative ADJUSTMENT',
            );
          }
          await validateLocation(fromLocationId, 'Source');
          await this.subtractInventory(
            tx,
            productId,
            fromLocationId,
            lotId || null,
            Math.abs(quantity),
          );
        }
      }

      // 3. Record Movement Log
      return tx.inventoryMovement.create({
        data: {
          type,
          productId,
          lotId: lotId || null,
          quantity,
          fromLocationId: fromLocationId || null,
          toLocationId: toLocationId || null,
          reason: reason || null,
          authorizedById,
        },
      });
    };

    // Use external transaction if provided, otherwise create a new one
    if (externalTx) {
      return runInTransaction(externalTx);
    } else {
      return this.prisma.$transaction((tx) => runInTransaction(tx));
    }
  }

  private async addInventory(
    tx: Prisma.TransactionClient,
    productId: string,
    locationId: string,
    lotId: string | null,
    amount: number,
  ) {
    // Find existing inventory record
    const existing = await tx.inventory.findUnique({
      where: {
        productId_locationId_lotId: {
          productId,
          locationId,
          lotId: lotId as string,
        },
      },
    });

    if (existing) {
      return tx.inventory.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + amount },
      });
    } else {
      return tx.inventory.create({
        data: {
          productId,
          locationId,
          lotId,
          quantity: amount,
        },
      });
    }
  }

  private async subtractInventory(
    tx: Prisma.TransactionClient,
    productId: string,
    locationId: string,
    lotId: string | null,
    amount: number,
  ) {
    // Find existing inventory record
    const existing = await tx.inventory.findUnique({
      where: {
        productId_locationId_lotId: {
          productId,
          locationId,
          lotId: lotId as string,
        },
      },
    });

    if (!existing || existing.quantity < amount) {
      const lotMsg = lotId ? ` for lot ID ${lotId}` : ' without lot';
      throw new BadRequestException(
        `Insufficient stock at location ${locationId} for product ${productId}${lotMsg}. ` +
          `Available: ${existing?.quantity || 0}, requested: ${amount}`,
      );
    }

    const newQty = existing.quantity - amount;

    if (newQty === 0) {
      // Clean up empty inventory record
      return tx.inventory.delete({
        where: { id: existing.id },
      });
    } else {
      return tx.inventory.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    }
  }
}
