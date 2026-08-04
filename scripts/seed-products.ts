import { ProductCategory } from '../src/modules/product/domain/product-category';

export interface SeedSkuDefinition {
  optionName: string;
  price: number;
  stock: number;
}

export interface SeedProductDefinition {
  name: string;
  description: string;
  basePrice: number;
  category: ProductCategory;
  isRecommended?: boolean;
  isDeleted?: boolean;
  skus: SeedSkuDefinition[];
}

export const SEED_PRODUCTS: SeedProductDefinition[] = [
  {
    name: '무선 이어폰',
    description: '노이즈 캔슬링을 지원하는 블루투스 무선 이어폰입니다.',
    basePrice: 79000,
    category: ProductCategory.ELECTRONICS,
    isRecommended: true,
    skus: [
      { optionName: '블랙', price: 79000, stock: 50 },
      { optionName: '화이트', price: 82000, stock: 0 },
      { optionName: '네이비', price: 79000, stock: 30 },
    ],
  },
  {
    name: '기계식 키보드',
    description: '87키 텐키리스 기계식 키보드입니다.',
    basePrice: 129000,
    category: ProductCategory.ELECTRONICS,
    skus: [
      { optionName: '청축', price: 129000, stock: 20 },
      { optionName: '적축', price: 129000, stock: 25 },
    ],
  },
  {
    name: '수분 크림',
    description: '히알루론산 저자극 수분 크림입니다.',
    basePrice: 32000,
    category: ProductCategory.BEAUTY,
    isRecommended: true,
    skus: [
      { optionName: '50ml', price: 32000, stock: 100 },
      { optionName: '100ml', price: 55000, stock: 40 },
    ],
  },
  {
    name: '비타민 세럼',
    description: '순수 비타민C 15% 고농축 세럼입니다.',
    basePrice: 45000,
    category: ProductCategory.BEAUTY,
    skus: [
      { optionName: '30ml', price: 45000, stock: 60 },
      { optionName: '30ml 리필', price: 39000, stock: 0 },
    ],
  },
  {
    name: '제주 감귤 3kg',
    description: '제주 산지직송 노지 감귤 3kg입니다.',
    basePrice: 15900,
    category: ProductCategory.FRESH_FOOD,
    isRecommended: true,
    skus: [
      { optionName: '가정용', price: 15900, stock: 120 },
      { optionName: '로열과', price: 19900, stock: 80 },
    ],
  },
  {
    name: '한우 등심 500g',
    description: '1++ 등급 한우 등심 냉장 500g입니다. (판매 종료)',
    basePrice: 42000,
    category: ProductCategory.FRESH_FOOD,
    isDeleted: true,
    skus: [
      { optionName: '1+ 등급', price: 42000, stock: 10 },
      { optionName: '1++ 등급', price: 52000, stock: 5 },
    ],
  },
];
