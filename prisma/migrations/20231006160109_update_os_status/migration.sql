/*
  Warnings:

  - The values [Cancelado] on the enum `services_orders_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `services_orders` MODIFY `status` ENUM('Rascunho', 'Aberto', 'Validado', 'Enviado', 'Faturado') NOT NULL DEFAULT 'Aberto';
