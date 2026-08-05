import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { ProductCategory } from './product-category';
import { Sku } from './sku.entity';

@Entity('products')
export class Product {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Index()
  @Column()
  basePrice: number;

  @Index()
  @Column({ type: 'enum', enum: ProductCategory })
  category: ProductCategory;

  @Index()
  @Column({ default: false })
  isRecommended: boolean;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index()
  @Column({ type: 'datetime', precision: 6, nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Sku, (sku: Sku) => sku.product)
  skus: Sku[];

  static create(params: {
    name: string;
    description: string;
    basePrice: number;
    category: ProductCategory;
    isRecommended?: boolean;
  }): Product {
    const product = new Product();
    product.id = uuidv7();
    product.name = params.name;
    product.description = params.description;
    product.basePrice = params.basePrice;
    product.category = params.category;
    product.isRecommended = params.isRecommended ?? false;
    product.deletedAt = null;
    return product;
  }

  delete(now: Date): void {
    this.deletedAt = now;
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
