-- AlterTable
ALTER TABLE `services_orders` ADD COLUMN `monthly_closing_id` VARCHAR(191) NULL,
    ADD COLUMN `validated_at` DATETIME(3) NULL,
    ADD COLUMN `validated_by` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `services_orders` ADD CONSTRAINT `services_orders_validated_by_fkey` FOREIGN KEY (`validated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `services_orders` ADD CONSTRAINT `services_orders_monthly_closing_id_fkey` FOREIGN KEY (`monthly_closing_id`) REFERENCES `Closing`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
