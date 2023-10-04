/*
  Warnings:

  - You are about to drop the column `file_hours` on the `services_orders_expenses` table. All the data in the column will be lost.
  - Added the required column `file_id` to the `services_orders_expenses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `services_orders_expenses` DROP COLUMN `file_hours`,
    ADD COLUMN `file_id` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `services_orders_expenses` ADD CONSTRAINT `services_orders_expenses_file_id_fkey` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
