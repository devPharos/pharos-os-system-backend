-- DropForeignKey
ALTER TABLE `services_orders_expenses` DROP FOREIGN KEY `services_orders_expenses_file_id_fkey`;

-- AlterTable
ALTER TABLE `services_orders_expenses` MODIFY `file_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `services_orders_expenses` ADD CONSTRAINT `services_orders_expenses_file_id_fkey` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
