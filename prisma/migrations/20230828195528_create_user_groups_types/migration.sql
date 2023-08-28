/*
  Warnings:

  - You are about to drop the column `name` on the `user_groups` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user_groups` DROP COLUMN `name`,
    ADD COLUMN `group` ENUM('ADMIN', 'COLLABORATOR', 'CLIENT') NOT NULL DEFAULT 'COLLABORATOR';
