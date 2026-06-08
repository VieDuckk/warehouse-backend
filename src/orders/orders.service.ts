import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateInboundOrderDto } from './dto/create-inbound-order.dto';
import { CreateOutboundOrderDto } from './dto/create-outbound-order.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ReceiveInboundOrderDto } from './dto/receive-inbound-order.dto';
import { ShipOutboundOrderDto } from './dto/ship-outbound-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  // --- Suppliers ---
  async createSupplier(dto: CreateSupplierDto) {
    const existing = await this.prisma.supplier.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Supplier with code ${dto.code} already exists`,
      );
    }
    return this.prisma.supplier.create({ data: dto });
  }

  async findAllSuppliers() {
    return this.prisma.supplier.findMany();
  }

  async findOneSupplier(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier)
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    return supplier;
  }

  // --- Customers ---
  async createCustomer(dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Customer with code ${dto.code} already exists`,
      );
    }
    return this.prisma.customer.create({ data: dto });
  }

  async findAllCustomers() {
    return this.prisma.customer.findMany();
  }

  async findOneCustomer(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer)
      throw new NotFoundException(`Customer with ID ${id} not found`);
    return customer;
  }

  // --- Inbound Orders ---
  async createInboundOrder(dto: CreateInboundOrderDto) {
    const existing = await this.prisma.inboundOrder.findUnique({
      where: { orderNumber: dto.orderNumber },
    });
    if (existing) {
      throw new ConflictException(
        `Inbound order ${dto.orderNumber} already exists`,
      );
    }

    return this.prisma.inboundOrder.create({
      data: {
        orderNumber: dto.orderNumber,
        supplierId: dto.supplierId,
        creatorId: dto.creatorId,
        items: {
          create: dto.items,
        },
      },
      include: { items: true },
    });
  }

  async findAllInboundOrders() {
    return this.prisma.inboundOrder.findMany({
      include: {
        supplier: true,
        creator: { select: { fullName: true } },
        _count: { select: { items: true } },
      },
    });
  }

  async findOneInboundOrder(id: string) {
    const order = await this.prisma.inboundOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        creator: { select: { fullName: true, email: true } },
        items: {
          include: { product: true },
        },
      },
    });
    if (!order)
      throw new NotFoundException(`Inbound order with ID ${id} not found`);
    return order;
  }

  async receiveInboundOrder(orderId: string, dto: ReceiveInboundOrderDto) {
    const order = await this.findOneInboundOrder(orderId);

    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new BadRequestException(
        `Cannot receive items for order in ${order.status} status`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Process each received item
      for (const item of dto.items) {
        // Validate item belongs to order
        const orderItem = order.items.find(
          (oi) => oi.productId === item.productId,
        );
        if (!orderItem) {
          throw new BadRequestException(
            `Product ${item.productId} is not part of order ${order.orderNumber}`,
          );
        }

        // Record stock receipt via InventoryService
        await this.inventoryService.createMovement(
          {
            type: 'RECEIPT',
            productId: item.productId,
            lotId: item.lotId,
            quantity: item.quantity,
            toLocationId: item.locationId,
            authorizedById: dto.authorizedById,
            reason: `Receipt for Inbound Order ${order.orderNumber}`,
          },
          tx,
        );

        // Update received quantity on order item
        await tx.inboundOrderItem.update({
          where: { id: orderItem.id },
          data: {
            qtyReceived: { increment: item.quantity },
          },
        });
      }

      // 2. Check if order is fully received
      const updatedOrder = await tx.inboundOrder.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      const allReceived = updatedOrder!.items.every(
        (it) => it.qtyReceived >= it.qtyExpected,
      );
      const newStatus = allReceived ? 'COMPLETED' : 'RECEIVING';

      return tx.inboundOrder.update({
        where: { id: orderId },
        data: { status: newStatus },
        include: { items: true },
      });
    });
  }

  // --- Outbound Orders ---
  async createOutboundOrder(dto: CreateOutboundOrderDto) {
    const existing = await this.prisma.outboundOrder.findUnique({
      where: { orderNumber: dto.orderNumber },
    });
    if (existing) {
      throw new ConflictException(
        `Outbound order ${dto.orderNumber} already exists`,
      );
    }

    return this.prisma.outboundOrder.create({
      data: {
        orderNumber: dto.orderNumber,
        customerId: dto.customerId,
        creatorId: dto.creatorId,
        items: {
          create: dto.items,
        },
      },
      include: { items: true },
    });
  }

  async findAllOutboundOrders() {
    return this.prisma.outboundOrder.findMany({
      include: {
        customer: true,
        creator: { select: { fullName: true } },
        _count: { select: { items: true } },
      },
    });
  }

  async findOneOutboundOrder(id: string) {
    const order = await this.prisma.outboundOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        creator: { select: { fullName: true, email: true } },
        items: {
          include: { product: true },
        },
      },
    });
    if (!order)
      throw new NotFoundException(`Outbound order with ID ${id} not found`);
    return order;
  }

  async shipOutboundOrder(orderId: string, dto: ShipOutboundOrderDto) {
    const order = await this.findOneOutboundOrder(orderId);

    if (order.status === 'SHIPPED' || order.status === 'CANCELLED') {
      throw new BadRequestException(
        `Cannot ship items for order in ${order.status} status`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Process each shipped item
      for (const item of dto.items) {
        // Validate item belongs to order
        const orderItem = order.items.find(
          (oi) => oi.productId === item.productId,
        );
        if (!orderItem) {
          throw new BadRequestException(
            `Product ${item.productId} is not part of order ${order.orderNumber}`,
          );
        }

        // Record stock shipment via InventoryService
        await this.inventoryService.createMovement(
          {
            type: 'SHIPMENT',
            productId: item.productId,
            lotId: item.lotId,
            quantity: item.quantity,
            fromLocationId: item.locationId,
            authorizedById: dto.authorizedById,
            reason: `Shipment for Outbound Order ${order.orderNumber}`,
          },
          tx,
        );

        // Update shipped quantity on order item
        await tx.outboundOrderItem.update({
          where: { id: orderItem.id },
          data: {
            qtyShipped: { increment: item.quantity },
          },
        });
      }

      // 2. Check if order is fully shipped
      const updatedOrder = await tx.outboundOrder.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      const allShipped = updatedOrder!.items.every(
        (it) => it.qtyShipped >= it.qtyRequested,
      );
      const newStatus = allShipped ? 'SHIPPED' : 'PICKING';

      return tx.outboundOrder.update({
        where: { id: orderId },
        data: { status: newStatus },
        include: { items: true },
      });
    });
  }
}
