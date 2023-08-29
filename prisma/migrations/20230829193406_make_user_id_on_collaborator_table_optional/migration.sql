-- DropForeignKey
ALTER TABLE `collaborators` DROP FOREIGN KEY `collaborators_user_id_fkey`;

-- AlterTable
ALTER TABLE `collaborators` MODIFY `user_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `collaborators` ADD CONSTRAINT `collaborators_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
