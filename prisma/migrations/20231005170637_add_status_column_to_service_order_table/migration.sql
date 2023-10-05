-- AlterTable
ALTER TABLE `services_orders` ADD COLUMN `status` ENUM('Aberto', 'Enviado', 'Faturado', 'Cancelado') NOT NULL DEFAULT 'Aberto';
