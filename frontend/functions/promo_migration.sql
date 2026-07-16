ALTER TABLE event_bookings ADD COLUMN promo_code TEXT;
ALTER TABLE event_bookings ADD COLUMN promo_pct INTEGER DEFAULT 0;
ALTER TABLE event_bookings ADD COLUMN promo_discount_rm INTEGER DEFAULT 0;
