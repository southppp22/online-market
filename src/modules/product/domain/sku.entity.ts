import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { Product } from './product.entity';
import { InsufficientStockError, SkuNotFoundError } from './sku.errors';

@Entity('skus')
@Index(['productId', 'stock'])
export class Sku {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => Product, (product: Product) => product.skus)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  optionName: string;

  @Column()
  price: number;

  @Column()
  stock: number;

  static create(
    productId: string,
    optionName: string,
    price: number,
    stock: number,
  ): Sku {
    const sku = new Sku();
    sku.id = uuidv7();
    sku.productId = productId;
    sku.optionName = optionName;
    sku.price = price;
    sku.stock = stock;
    return sku;
  }

  decreaseStock(quantity: number): void {
    if (this.stock < quantity) {
      throw new InsufficientStockError(this.id);
    }
    this.stock -= quantity;
  }

  increaseStock(quantity: number): void {
    this.stock += quantity;
  }

  isSoldOut(): boolean {
    return this.stock === 0;
  }

  // product 관계가 로드된 상태에서만 호출할 수 있다.
  isUnavailable(): boolean {
    return this.isSoldOut() || this.product.isDeleted();
  }

  // product 관계가 로드된 상태에서만 호출할 수 있다.
  assertAddableToCart(): void {
    if (this.product.isDeleted()) {
      throw new SkuNotFoundError(this.id);
    }
  }
}
