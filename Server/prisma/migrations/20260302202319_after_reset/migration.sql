/*
  Warnings:

  - You are about to drop the column `createdby` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `createdby` on the `Task` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Task` DROP FOREIGN KEY `Task_sessionId_fkey`;

-- DropIndex
DROP INDEX `Task_sessionId_fkey` ON `Task`;

-- AlterTable
ALTER TABLE `Session` DROP COLUMN `createdby`;

-- AlterTable
ALTER TABLE `Task` DROP COLUMN `createdby`;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
