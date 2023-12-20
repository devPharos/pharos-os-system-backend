/*
  Warnings:

  - You are about to drop the column `supervisorId` on the `collaborators` table. All the data in the column will be lost.
  - You are about to drop the `supervisor` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `collaborators` DROP FOREIGN KEY `collaborators_supervisorId_fkey`;

-- DropForeignKey
ALTER TABLE `supervisor` DROP FOREIGN KEY `Supervisor_company_id_fkey`;

-- DropForeignKey
ALTER TABLE `supervisor` DROP FOREIGN KEY `Supervisor_user_id_fkey`;

-- AlterTable
ALTER TABLE `collaborators` DROP COLUMN `supervisorId`,
    ADD COLUMN `isSupervisor` BOOLEAN NULL DEFAULT false;

-- DropTable
DROP TABLE `supervisor`;
