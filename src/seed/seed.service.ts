import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeedService {
  constructor(private readonly prisma: PrismaService) {}

  async seed() {
    // 1. Create a User
    const user = await this.prisma.user.upsert({
      where: { email: 'admin@warehouse.com' },
      update: {},
      create: {
        email: 'admin@warehouse.com',
        fullName: 'Warehouse Admin',
        password: 'password123',
        role: 'ADMIN',
      },
    });

    // 2. Create Warehouse, Zone, Location
    const warehouse = await this.prisma.warehouse.upsert({
      where: { code: 'WH1' },
      update: {},
      create: {
        name: 'Main Warehouse',
        code: 'WH1',
        address: '123 Logistics St',
      },
    });

    const zone = await this.prisma.zone.upsert({
      where: { warehouseId_code: { warehouseId: warehouse.id, code: 'Z1' } },
      update: {},
      create: {
        name: 'General Storage',
        code: 'Z1',
        warehouseId: warehouse.id,
      },
    });

    const loc1 = await this.prisma.location.upsert({
      where: { code: 'LOC-01' },
      update: {},
      create: {
        code: 'LOC-01',
        zoneId: zone.id,
        aisle: '1',
        shelf: 'A',
      },
    });

    // const loc2 = await this.prisma.location.upsert({
    //   where: { code: 'LOC-02' },
    //   update: {},
    //   create: {
    //     code: 'LOC-02',
    //     zoneId: zone.id,
    //     aisle: '1',
    //     shelf: 'B',
    //   },
    // });

    // 3. Create Category and Product
    const category = await this.prisma.category.upsert({
      where: { name: 'Electronics' },
      update: {},
      create: {
        name: 'Electronics',
        description: 'Electronic gadgets and parts',
      },
    });

    const product = await this.prisma.product.upsert({
      where: { sku: 'SKU-ELECT-001' },
      update: {},
      create: {
        sku: 'SKU-ELECT-001',
        name: 'High-Performance Battery',
        description: 'Lithium-ion 5000mAh',
        price: 25.0,
        categoryId: category.id,
      },
    });

    // 4. Create Supplier and Customer
    const supplier = await this.prisma.supplier.upsert({
      where: { code: 'SUPP-01' },
      update: {},
      create: {
        name: 'Global Tech Suppliers',
        code: 'SUPP-01',
      },
    });

    const customer = await this.prisma.customer.upsert({
      where: { code: 'CUST-01' },
      update: {},
      create: {
        name: 'Retail Partner X',
        code: 'CUST-01',
      },
    });

    return {
      message: 'Seeding successful',
      user,
      warehouse,
      location: loc1,
      product,
      supplier,
      customer,
    };
  }
}
