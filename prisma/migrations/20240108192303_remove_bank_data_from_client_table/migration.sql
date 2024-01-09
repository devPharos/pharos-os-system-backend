/*
  Warnings:

  - You are about to drop the column `account` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `account_digit` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `agency` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `agency_digit` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `bank` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `pix_key` on the `clients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `clients` DROP COLUMN `account`,
    DROP COLUMN `account_digit`,
    DROP COLUMN `agency`,
    DROP COLUMN `agency_digit`,
    DROP COLUMN `bank`,
    DROP COLUMN `pix_key`;
