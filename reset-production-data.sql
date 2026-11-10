-- ==============================================================================
-- CAMPUS MARKETPLACE - ONE-TIME PRODUCTION DATA RESET SCRIPT
-- Target Database: Aiven Cloud MySQL 8.x / Local MySQL
--
-- PURPOSE:
-- Safely deletes all existing user-generated marketplace data (users, listings,
-- wishlists, inquiries, messages) while 100% PRESERVING table definitions,
-- schema structure, columns, primary keys, foreign keys, indexes, and database users.
--
-- TABLE HIERARCHY & DEPENDENCY ORDER:
-- Level 1 (Child):  inquiry_replies  -> references inquiries(id), users(id)
-- Level 2 (Middle): inquiries        -> references listings(id), users(id)
-- Level 2 (Middle): wishlists        -> references listings(id), users(id)
-- Level 3 (Middle): listings         -> references users(id)
-- Level 4 (Parent): users            -> root entity (sellers, buyers, senders, receivers)
-- ==============================================================================

-- Step 1: Temporarily disable foreign key checks for safe, error-free deletion
SET FOREIGN_KEY_CHECKS = 0;

-- Step 2: Delete all records from child tables to parent tables
DELETE FROM inquiry_replies;
DELETE FROM inquiries;
DELETE FROM wishlists;
DELETE FROM listings;
DELETE FROM users;

-- Step 3: Reset AUTO_INCREMENT counters to 1 so fresh records start from ID 1
ALTER TABLE inquiry_replies AUTO_INCREMENT = 1;
ALTER TABLE inquiries AUTO_INCREMENT = 1;
ALTER TABLE wishlists AUTO_INCREMENT = 1;
ALTER TABLE listings AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

-- Step 4: Re-enable foreign key constraints
SET FOREIGN_KEY_CHECKS = 1;

-- Step 5: Verification query to confirm all tables are completely empty
SELECT 
    (SELECT COUNT(*) FROM users) AS remaining_users,
    (SELECT COUNT(*) FROM listings) AS remaining_listings,
    (SELECT COUNT(*) FROM wishlists) AS remaining_wishlists,
    (SELECT COUNT(*) FROM inquiries) AS remaining_inquiries,
    (SELECT COUNT(*) FROM inquiry_replies) AS remaining_inquiry_replies;
