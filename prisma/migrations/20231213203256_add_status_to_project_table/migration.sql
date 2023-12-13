-- AlterTable
ALTER TABLE `projects` ADD COLUMN `status` ENUM('NaoIniciado', 'Iniciado', 'Finalizado', 'Cancelado') NOT NULL DEFAULT 'NaoIniciado';
