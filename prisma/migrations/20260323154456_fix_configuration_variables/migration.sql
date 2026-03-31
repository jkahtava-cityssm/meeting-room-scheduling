UPDATE "configuration"
SET key = 'timeSlotInterval'
WHERE key = 'timeSlotIntervalMinutes';

INSERT INTO "configuration"
(key,description,value,type, name,updated_at)
VALUES 
('maxBookingSpan','0 = no limit, determines the maximum number in the future a user can create events',30,'number','Max Booking Span',CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;