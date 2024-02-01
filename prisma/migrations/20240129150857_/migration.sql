/*
  Warnings:

  - A unique constraint covering the columns `[fileId]` on the table `collaborators` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `collaborators_fileId_key` ON `collaborators`(`fileId`);
