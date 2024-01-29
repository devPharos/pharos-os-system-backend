/*
  Warnings:

  - You are about to drop the column `period` on the `closing` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `Closing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Closing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `closing` DROP COLUMN `period`,
    ADD COLUMN `endDate` DATETIME(3) NOT NULL,
    ADD COLUMN `startDate` DATETIME(3) NOT NULL;
