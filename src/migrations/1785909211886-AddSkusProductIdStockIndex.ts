import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSkusProductIdStockIndex1785909211886 implements MigrationInterface {
    name = 'AddSkusProductIdStockIndex1785909211886'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX \`IDX_615ade85c9e76b27ef151d364f\` ON \`skus\` (\`productId\`, \`stock\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_615ade85c9e76b27ef151d364f\` ON \`skus\``);
    }

}
