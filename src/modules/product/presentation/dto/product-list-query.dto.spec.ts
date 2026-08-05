import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ProductListQueryDto } from './product-list-query.dto';

function validate(query: Record<string, string>): string[] {
  const dto = plainToInstance(ProductListQueryDto, query);
  return validateSync(dto).flatMap((error) =>
    Object.keys(error.constraints ?? {}),
  );
}

describe('ProductListQueryDto', () => {
  describe('조회 상한 검증', () => {
    it('page와 size를 모두 생략하면 통과한다', () => {
      expect(validate({})).toEqual([]);
    });

    it('오프셋이 상한 미만이면 통과한다', () => {
      expect(validate({ page: '500', size: '20' })).toEqual([]);
    });

    it('오프셋이 상한과 같으면 거절한다', () => {
      expect(validate({ page: '501', size: '20' })).toContain(
        'withinMaxResults',
      );
    });

    it('size가 크면 더 낮은 page에서 거절한다', () => {
      expect(validate({ page: '100', size: '100' })).toEqual([]);
      expect(validate({ page: '101', size: '100' })).toContain(
        'withinMaxResults',
      );
    });
  });
});
