import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(createCategoryDto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAllCategories() {
    return this.prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async createProduct(createProductDto: CreateProductDto) {
    // Check unique sku and barcode
    const existingSkuPromise = this.prisma.product.findUnique({
      where: { sku: createProductDto.sku },
    });
    const existingBarcodePromise = createProductDto.barcode
      ? this.prisma.product.findUnique({
          where: { barcode: createProductDto.barcode },
        })
      : Promise.resolve(null);

    const [existingSku, existingBarcode] = await Promise.all([
      existingSkuPromise,
      existingBarcodePromise,
    ]);

    if (existingSku) {
      throw new ConflictException(
        `Product with SKU ${createProductDto.sku} already exists`,
      );
    }
    if (existingBarcode) {
      throw new ConflictException(
        `Product with barcode ${createProductDto.barcode} already exists`,
      );
    }

    // Validate category if provided
    if (createProductDto.categoryId) {
      const cat = await this.prisma.category.findUnique({
        where: { id: createProductDto.categoryId },
      });
      if (!cat) {
        throw new NotFoundException(
          `Category with ID ${createProductDto.categoryId} not found`,
        );
      }
    }

    return this.prisma.product.create({
      data: createProductDto,
    });
  }

  async findAllProducts() {
    return this.prisma.product.findMany({
      include: {
        category: true,
      },
    });
  }

  async findOneProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        inventories: {
          include: {
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
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Calculate total stock
    const totalStock = product.inventories.reduce(
      (sum, inv) => sum + inv.quantity,
      0,
    );

    return {
      ...product,
      totalStock,
    };
  }
}
