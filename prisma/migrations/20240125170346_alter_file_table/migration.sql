/*
  Warnings:

  - You are about to drop the column `key` on the `files` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fileId]` on the table `files` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fileId` to the `files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `files` DROP COLUMN `key`,
    ADD COLUMN `fileId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `files_fileId_key` ON `files`(`fileId`);
