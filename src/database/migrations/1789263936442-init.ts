import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1789263936442 implements MigrationInterface {
    name = 'Init1789263936442'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey"`);
        await queryRunner.query(`DROP INDEX "public"."users_email_key"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "notifications_pkey"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "userId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "title" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "message"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "message" character varying NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationType" RENAME TO "NotificationType_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('INFO', 'WARNING', 'ERROR', 'SUCCESS')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" SET DEFAULT 'INFO'`);
        await queryRunner.query(`DROP TYPE "public"."NotificationType_old"`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationStatus" RENAME TO "NotificationStatus_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_status_enum" AS ENUM('PENDING', 'SENT', 'FAILED', 'READ')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "status" TYPE "public"."notifications_status_enum" USING "status"::"text"::"public"."notifications_status_enum"`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."NotificationStatus_old"`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "readAt" TYPE TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "createdAt" TYPE TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "updatedAt" TYPE TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "users_pkey"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "createdAt" TYPE TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updatedAt" TYPE TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updatedAt" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updatedAt" TYPE TIMESTAMP(3)`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "createdAt" TYPE TIMESTAMP(3)`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "id" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "updatedAt" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "updatedAt" TYPE TIMESTAMP(3)`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "createdAt" TYPE TIMESTAMP(3)`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "readAt" TYPE TIMESTAMP(3)`);
        await queryRunner.query(`CREATE TYPE "public"."NotificationStatus_old" AS ENUM('PENDING', 'SENT', 'FAILED', 'READ')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "status" TYPE "public"."NotificationStatus_old" USING "status"::"text"::"public"."NotificationStatus_old"`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationStatus_old" RENAME TO "NotificationStatus"`);
        await queryRunner.query(`CREATE TYPE "public"."NotificationType_old" AS ENUM('INFO', 'WARNING', 'ERROR', 'SUCCESS')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."NotificationType_old" USING "type"::"text"::"public"."NotificationType_old"`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" SET DEFAULT 'INFO'`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."NotificationType_old" RENAME TO "NotificationType"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "message"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "message" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "title" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "userId" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "id" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email") `);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    }

}
