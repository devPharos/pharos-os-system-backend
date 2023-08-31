/*
  Warnings:

  - You are about to drop the column `require_receipt` on the `projects_expenses` table. All the data in the column will be lost.
  - You are about to drop the column `project_service_id` on the `services_orders_expenses` table. All the data in the column will be lost.
  - Added the required column `project_expenses_id` to the `services_orders_expenses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `services_orders_expenses` DROP FOREIGN KEY `services_orders_expenses_project_service_id_fkey`;

-- AlterTable
ALTER TABLE `projects_expenses` DROP COLUMN `require_receipt`,
    ADD COLUMN `requireReceipt` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `services_orders_expenses` DROP COLUMN `project_service_id`,
    ADD COLUMN `project_expenses_id` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `services_orders_expenses` ADD CONSTRAINT `services_orders_expenses_project_expenses_id_fkey` FOREIGN KEY (`project_expenses_id`) REFERENCES `projects_expenses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
