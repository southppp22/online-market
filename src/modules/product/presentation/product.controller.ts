import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { ProductService } from '../application/product.service';
import { ProductDetailResponseDto } from './dto/product-detail-response.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { ProductListResponseDto } from './dto/product-list-response.dto';
import { RecommendedProductsQueryDto } from './dto/recommended-products-query.dto';
import { RecommendedProductsResponseDto } from './dto/recommended-products-response.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @Get()
  async list(
    @Query() query: ProductListQueryDto,
  ): Promise<ProductListResponseDto> {
    const items = await this.productService.listProducts(query.toFilter());
    return ProductListResponseDto.from(items, query);
  }

  // ':productId' 라우트보다 먼저 선언해야 'recommended'가 UUID 파라미터로 매칭되지 않는다.
  @Public()
  @Get('recommended')
  async recommended(
    @Query() query: RecommendedProductsQueryDto,
  ): Promise<RecommendedProductsResponseDto> {
    const items = await this.productService.listRecommendedProducts(query.size);
    return RecommendedProductsResponseDto.from(items);
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
