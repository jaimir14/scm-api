/*
  Warnings:

  - You are about to drop the column `fotografia` on the `patients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `patients` DROP COLUMN `fotografia`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `fotografia` VARCHAR(500) NULL;
