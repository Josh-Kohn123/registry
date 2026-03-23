-- AddForeignKey
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
