-- AlterTable
ALTER TABLE `collaborators` ADD COLUMN `fileId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `collaborators` ADD CONSTRAINT `collaborators_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `files`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
