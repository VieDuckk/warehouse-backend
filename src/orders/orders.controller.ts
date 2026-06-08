import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateInboundOrderDto } from './dto/create-inbound-order.dto';
import { CreateOutboundOrderDto } from './dto/create-outbound-order.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ReceiveInboundOrderDto } from './dto/receive-inbound-order.dto';
import { ShipOutboundOrderDto } from './dto/ship-outbound-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('suppliers')
  createSupplier(@Body() dto: CreateSupplierDto) {
    return this.ordersService.createSupplier(dto);
  }

  @Get('suppliers')
  findAllSuppliers() {
    return this.ordersService.findAllSuppliers();
  }

  @Post('customers')
  createCustomer(@Body() dto: CreateCustomerDto) {
    return this.ordersService.createCustomer(dto);
  }

  @Get('customers')
  findAllCustomers() {
    return this.ordersService.findAllCustomers();
  }

  @Post('inbound')
  createInboundOrder(@Body() dto: CreateInboundOrderDto) {
    return this.ordersService.createInboundOrder(dto);
  }

  @Get('inbound')
  findAllInboundOrders() {
    return this.ordersService.findAllInboundOrders();
  }

  @Get('inbound/:id')
  findOneInboundOrder(@Param('id') id: string) {
    return this.ordersService.findOneInboundOrder(id);
  }

  @Post('inbound/:id/receive')
  receiveInboundOrder(
    @Param('id') id: string,
    @Body() dto: ReceiveInboundOrderDto,
  ) {
    return this.ordersService.receiveInboundOrder(id, dto);
  }

  @Post('outbound')
  createOutboundOrder(@Body() dto: CreateOutboundOrderDto) {
    return this.ordersService.createOutboundOrder(dto);
  }

  @Get('outbound')
  findAllOutboundOrders() {
    return this.ordersService.findAllOutboundOrders();
  }

  @Get('outbound/:id')
  findOneOutboundOrder(@Param('id') id: string) {
    return this.ordersService.findOneOutboundOrder(id);
  }

  @Post('outbound/:id/ship')
  shipOutboundOrder(
    @Param('id') id: string,
    @Body() dto: ShipOutboundOrderDto,
  ) {
    return this.ordersService.shipOutboundOrder(id, dto);
  }
}
