-- AlterTable
ALTER TABLE `support` ADD COLUMN `helperTopic` ENUM('Desenvolvimento', 'Suporte', 'Infraestrutura', 'Modulos', 'Faturamento') NOT NULL DEFAULT 'Desenvolvimento';
