import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/presentation/current-user.decorator';
import { OrderService } from '../application/order.service';
import { CancelOrderResponseDto } from './dto/cancel-order-response.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderResponseDto } from './dto/create-order-response.dto';
import { OrderDetailResponseDto } from './dto/order-detail-response.dto';
import { OrderListQueryDto } from './dto/order-list-query.dto';
import { OrderListResponseDto } from './dto/order-list-response.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(
    @CurrentUser() userId: string,
    @Body() dto: CreateOrderDto,
  ): Promise<CreateOrderResponseDto> {
    const { order, payment } = await this.orderService.createOrder(
      userId,
      dto.toInput(),
    );
    return CreateOrderResponseDto.from(order, payment);
  }

  @Get()
  async list(
    @CurrentUser() userId: string,
    @Query() query: OrderListQueryDto,
  ): Promise<OrderListResponseDto> {
    const result = await this.orderService.getOrders(userId, query.toFilter());
    return OrderListResponseDto.from(result, query);
  }

  @Post(':orderId/cancel')
  @HttpCode(200)
  async cancel(
    @CurrentUser() userId: string,
    @Param('orderId', new ParseUUIDPipe({ version: '7' }))
    orderId: string,
  ): Promise<CancelOrderResponseDto> {
    const { order, refundAmount } = await this.orderService.cancelOrder(
      orderId,
      userId,
    );
    return CancelOrderResponseDto.from(order, refundAmount);
  }

  @Get(':orderId')
  async detail(
    @CurrentUser() userId: string,
    @Param('orderId', new ParseUUIDPipe({ version: '7' }))
    orderId: string,
  ): Promise<OrderDetailResponseDto> {
    const order = await this.orderService.getOrderDetail(orderId, userId);
    return OrderDetailResponseDto.from(order);
  }
}
