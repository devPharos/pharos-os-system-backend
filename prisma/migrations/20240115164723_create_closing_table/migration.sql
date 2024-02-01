-- CreateTable
CREATE TABLE `Closing` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(6) NOT NULL,
    `totalValidatedHours` VARCHAR(191) NOT NULL,
    `totalValue` VARCHAR(191) NOT NULL,
    `expensesTotalValue` VARCHAR(191) NOT NULL,
    `taxTotalValue` VARCHAR(191) NOT NULL,
    `status` ENUM('Aberto', 'Cancelado', 'Pago') NOT NULL DEFAULT 'Aberto',
    `paymentDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Closing` ADD CONSTRAINT `Closing_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Closing` ADD CONSTRAINT `Closing_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
