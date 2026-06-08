import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('categories')
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.productsService.createCategory(createCategoryDto);
  }

  @Get('categories')
  findAllCategories() {
    return this.productsService.findAllCategories();
  }

  @Post('products')
  createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsService.createProduct(createProductDto);
  }

  @Get('products')
  findAllProducts() {
    return this.productsService.findAllProducts();
  }

  @Get('products/:id')
  findOneProduct(@Param('id') id: string) {
    return this.productsService.findOneProduct(id);
  }
}
