import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { ProductService } from '../application/product.service';
import { ProductDetailResponseDto } from './dto/product-detail-response.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { ProductListResponseDto } from './dto/product-list-response.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @Get()
  async list(
    @Query() query: ProductListQueryDto,
  ): Promise<ProductListResponseDto> {
    const result = await this.productService.listProducts(query.toFilter());
    return ProductListResponseDto.from(result, query);
  }

  @Public()
  @Get(':productId')
  async detail(
    @Param('productId', new ParseUUIDPipe({ version: '7' }))
    productId: string,
  ): Promise<ProductDetailResponseDto> {
    const product = await this.productService.getProductDetail(productId);
    return ProductDetailResponseDto.from(product);
  }
}
