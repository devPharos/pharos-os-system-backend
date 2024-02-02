-- AlterTable
ALTER TABLE `Collaborators` ADD COLUMN `fileId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Collaborators` ADD CONSTRAINT `collaborators_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
