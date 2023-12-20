/*
  Warnings:

  - You are about to drop the column `isSupervisor` on the `collaborators` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `collaborators` DROP COLUMN `isSupervisor`,
    ADD COLUMN `supervisor_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `collaborators` ADD CONSTRAINT `collaborators_supervisor_id_fkey` FOREIGN KEY (`supervisor_id`) REFERENCES `collaborators`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
