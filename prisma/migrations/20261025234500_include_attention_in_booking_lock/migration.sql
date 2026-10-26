ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "no_overlapping_bookings";
ALTER TABLE "bookings" ADD CONSTRAINT "no_overlapping_bookings" EXCLUDE USING gist (
    "apartment_id" WITH =,
    daterange("check_in", "check_out", '[)') WITH &&
) WHERE ("status" IN ('pending', 'processing', 'confirmed', 'attention_required'));
