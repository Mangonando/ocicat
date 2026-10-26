-- Add is_mine flag: 1 if the class was taught by the primary teacher, 0 for subs
ALTER TABLE classes ADD COLUMN is_mine INTEGER NOT NULL DEFAULT 1;
