-- DropForeignKey
ALTER TABLE `clients` DROP FOREIGN KEY `clients_user_id_fkey`;

-- AlterTable
ALTER TABLE `clients` MODIFY `user_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
