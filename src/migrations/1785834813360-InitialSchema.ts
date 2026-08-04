import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1785834813360 implements MigrationInterface {
    name = 'InitialSchema1785834813360'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`cart_items\` (\`id\` varchar(255) NOT NULL, \`userId\` varchar(255) NOT NULL, \`skuId\` varchar(255) NOT NULL, \`quantity\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_e68869c5f3a7058e81fbdc86e6\` (\`userId\`, \`skuId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`coupons\` (\`id\` varchar(255) NOT NULL, \`userId\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`discountAmount\` int NOT NULL, \`minOrderAmount\` int NOT NULL, \`expiresAt\` datetime(6) NOT NULL, \`usedAt\` datetime(6) NULL, \`usedOrderId\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_81dcb5419991c66b6fd4a1b618\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`orders\` (\`id\` varchar(255) NOT NULL, \`userId\` varchar(255) NOT NULL, \`idempotencyKey\` varchar(255) NOT NULL, \`status\` enum ('PENDING', 'PAID', 'SHIPPING', 'DELIVERED', 'FAILED', 'CANCELLED') NOT NULL, \`couponId\` varchar(255) NULL, \`itemsAmount\` int NOT NULL, \`discountAmount\` int NOT NULL, \`shippingFee\` int NOT NULL, \`totalAmount\` int NOT NULL, \`receiverName\` varchar(255) NOT NULL, \`receiverAddress\` varchar(255) NOT NULL, \`receiverPhone\` varchar(255) NOT NULL, \`receiverMessage\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_151b79a83ba240b0cb31b2302d\` (\`userId\`), INDEX \`IDX_775c9f06fc27ae3ff8fb26f2c4\` (\`status\`), UNIQUE INDEX \`IDX_dd369f541be59ba280e886423f\` (\`userId\`, \`idempotencyKey\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`order_items\` (\`id\` varchar(255) NOT NULL, \`orderId\` varchar(255) NOT NULL, \`skuId\` varchar(255) NOT NULL, \`productName\` varchar(255) NOT NULL, \`optionName\` varchar(255) NOT NULL, \`price\` int NOT NULL, \`quantity\` int NOT NULL, INDEX \`IDX_f1d359a55923bb45b057fbdab0\` (\`orderId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`payments\` (\`id\` varchar(255) NOT NULL, \`orderId\` varchar(255) NOT NULL, \`method\` enum ('PAY_MONEY', 'CARD') NOT NULL, \`amount\` int NOT NULL, \`status\` enum ('REQUESTED', 'APPROVED', 'FAILED', 'CANCELLED') NOT NULL, \`expiresAt\` datetime(6) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_af929a5f2a400fdb6913b4967e\` (\`orderId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`skus\` (\`id\` varchar(255) NOT NULL, \`productId\` varchar(255) NOT NULL, \`optionName\` varchar(255) NOT NULL, \`price\` int NOT NULL, \`stock\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`products\` (\`id\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`basePrice\` int NOT NULL, \`category\` enum ('ELECTRONICS', 'BEAUTY', 'FRESH_FOOD') NOT NULL, \`isRecommended\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, INDEX \`IDX_7f5eb16c28c2c4c29ec14b7201\` (\`basePrice\`), INDEX \`IDX_c3932231d2385ac248d0888d95\` (\`category\`), INDEX \`IDX_d537b8e05c59e57d93275d22a7\` (\`isRecommended\`), INDEX \`IDX_63fcb3d8806a6efd53dbc67430\` (\`createdAt\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`passwordHash\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`phone\` varchar(255) NOT NULL, \`payMoneyBalance\` int NOT NULL DEFAULT '0', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`order_items\` ADD CONSTRAINT \`FK_f1d359a55923bb45b057fbdab0d\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`skus\` ADD CONSTRAINT \`FK_7beba067c3aa6601fa17a0bda80\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`skus\` DROP FOREIGN KEY \`FK_7beba067c3aa6601fa17a0bda80\``);
        await queryRunner.query(`ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_f1d359a55923bb45b057fbdab0d\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_63fcb3d8806a6efd53dbc67430\` ON \`products\``);
        await queryRunner.query(`DROP INDEX \`IDX_d537b8e05c59e57d93275d22a7\` ON \`products\``);
        await queryRunner.query(`DROP INDEX \`IDX_c3932231d2385ac248d0888d95\` ON \`products\``);
        await queryRunner.query(`DROP INDEX \`IDX_7f5eb16c28c2c4c29ec14b7201\` ON \`products\``);
        await queryRunner.query(`DROP TABLE \`products\``);
        await queryRunner.query(`DROP TABLE \`skus\``);
        await queryRunner.query(`DROP INDEX \`IDX_af929a5f2a400fdb6913b4967e\` ON \`payments\``);
        await queryRunner.query(`DROP TABLE \`payments\``);
        await queryRunner.query(`DROP INDEX \`IDX_f1d359a55923bb45b057fbdab0\` ON \`order_items\``);
        await queryRunner.query(`DROP TABLE \`order_items\``);
        await queryRunner.query(`DROP INDEX \`IDX_dd369f541be59ba280e886423f\` ON \`orders\``);
        await queryRunner.query(`DROP INDEX \`IDX_775c9f06fc27ae3ff8fb26f2c4\` ON \`orders\``);
        await queryRunner.query(`DROP INDEX \`IDX_151b79a83ba240b0cb31b2302d\` ON \`orders\``);
        await queryRunner.query(`DROP TABLE \`orders\``);
        await queryRunner.query(`DROP INDEX \`IDX_81dcb5419991c66b6fd4a1b618\` ON \`coupons\``);
        await queryRunner.query(`DROP TABLE \`coupons\``);
        await queryRunner.query(`DROP INDEX \`IDX_e68869c5f3a7058e81fbdc86e6\` ON \`cart_items\``);
        await queryRunner.query(`DROP TABLE \`cart_items\``);
    }

}
