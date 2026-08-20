CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings" 
ADD CONSTRAINT no_overlapping_bookings
EXCLUDE USING gist (
    apartment_id WITH =,
    daterange("check_in", "check_out", '[]') WITH &&
) WHERE (status IN ('pending', 'confirmed'));
