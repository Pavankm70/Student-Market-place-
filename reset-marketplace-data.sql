-- ==============================================================================
-- CAMPUS MARKETPLACE - SAFE ONE-TIME DATABASE CLEANUP SCRIPT
-- Compatible with Aiven Cloud MySQL 8.x / Local MySQL
--
-- PURPOSE:
-- Deletes old dummy/sample marketplace records while preserving all table
-- definitions, columns, primary keys, foreign keys, indexes, and database users.
--
-- ENTITY RELATIONSHIPS & DELETION HIERARCHY:
-- 1. inquiry_replies -> references inquiries(id), users(id)
-- 2. inquiries       -> references listings(id), users(id)
-- 3. wishlists       -> references listings(id), users(id)
-- 4. listings        -> references users(id)
-- 5. users           -> root entity (sellers, buyers, senders, receivers)
--
-- NOTE ON CATEGORIES:
-- Category in this application is implemented as an enum (Category.java: BOOKS,
-- ELECTRONICS, LAB_SUPPLIES, FURNITURE, STATIONERY, CLOTHING, OTHER), stored as
-- a VARCHAR column in the 'listings' table. Deleting listings removes all product
-- categories, while the enum definitions in code remain intact for future items.
--
-- NOTE ON ADMIN ACCOUNTS:
-- The application uses a unified student role model (ROLE_STUDENT) where every
-- student account can buy, sell, and message. There is no hardcoded admin account
-- in the database.
-- If you registered a personal student account (e.g., your real email) that you
-- want to keep, replace "DELETE FROM users;" with:
--   DELETE FROM users WHERE email IN ('alex@nmit.ac.in', 'sarah@nmit.ac.in', 'marcus@nmit.ac.in');
-- Otherwise, the script below safely cleans all dummy users and sample data.
-- ==============================================================================

-- Step 1: Temporarily disable foreign key checks to prevent FK constraint violations
SET FOREIGN_KEY_CHECKS = 0;

-- Step 2: Delete data from child tables to parent tables
DELETE FROM inquiry_replies;
DELETE FROM inquiries;
DELETE FROM wishlists;
DELETE FROM listings;
DELETE FROM users;

-- Step 3: Reset AUTO_INCREMENT counters to 1 for clean production IDs
ALTER TABLE inquiry_replies AUTO_INCREMENT = 1;
ALTER TABLE inquiries AUTO_INCREMENT = 1;
ALTER TABLE wishlists AUTO_INCREMENT = 1;
ALTER TABLE listings AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

-- Step 4: Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Step 5: Verification query to confirm all tables are clean and ready for real data
SELECT 
    (SELECT COUNT(*) FROM users) AS remaining_users,
    (SELECT COUNT(*) FROM listings) AS remaining_listings,
    (SELECT COUNT(*) FROM wishlists) AS remaining_wishlists,
    (SELECT COUNT(*) FROM inquiries) AS remaining_inquiries,
    (SELECT COUNT(*) FROM inquiry_replies) AS remaining_inquiry_replies;
