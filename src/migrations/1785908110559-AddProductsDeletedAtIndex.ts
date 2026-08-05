import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductsDeletedAtIndex1785908110559 implements MigrationInterface {
    name = 'AddProductsDeletedAtIndex1785908110559'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX \`IDX_b63efb0c6f580771b76dd64236\` ON \`products\` (\`deletedAt\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_b63efb0c6f580771b76dd64236\` ON \`products\``);
    }

}
