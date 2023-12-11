-- AlterTable
ALTER TABLE `projects` MODIFY `end_date` DATETIME(3) NULL,
    MODIFY `hours_balance` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Support` (
    `id` VARCHAR(191) NOT NULL,
    `collaboratorId` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `status` ENUM('Atraso', 'NaoIniciado', 'Iniciado', 'Finalizado') NOT NULL DEFAULT 'NaoIniciado',
    `priority` ENUM('Alta', 'Media', 'Baixa') NOT NULL DEFAULT 'Media',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SupportMessage` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `supportId` VARCHAR(191) NOT NULL,
    `message` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Support` ADD CONSTRAINT `Support_collaboratorId_fkey` FOREIGN KEY (`collaboratorId`) REFERENCES `collaborators`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Support` ADD CONSTRAINT `Support_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Support` ADD CONSTRAINT `Support_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportMessage` ADD CONSTRAINT `SupportMessage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportMessage` ADD CONSTRAINT `SupportMessage_supportId_fkey` FOREIGN KEY (`supportId`) REFERENCES `Support`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
