/*
  Warnings:

  - The primary key for the `user_groups` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `user_groups` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `group_id` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_group_id_fkey`;

-- AlterTable
ALTER TABLE `user_groups` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `users` MODIFY `group_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `user_groups`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
