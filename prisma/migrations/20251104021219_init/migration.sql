/*
  Warnings:

  - A unique constraint covering the columns `[askListingId,giveListingId]` on the table `Match` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Match_askListingId_giveListingId_key" ON "Match"("askListingId", "giveListingId");
