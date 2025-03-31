# Supabase Backend Functions & Data Interactions for DfyFx Trader App

This document outlines the potential backend functions and database interactions, likely implemented using Supabase Edge Functions or direct database operations with Row Level Security (RLS), needed for the DfyFx Trader web application features.

## 1. Authentication (Supabase Auth)

*   **`signUp(email, password)`**: Handles user registration using Supabase Auth.
*   **`signIn(email, password)`**: Handles user login using Supabase Auth.
*   **`signOut()`**: Logs the user out.
*   **`resetPassword(email)`**: Initiates the password reset flow (Supabase Auth handles email sending).
*   **`updateUserPassword(newPassword)`**: Allows logged-in users to change their password.
*   **`getSession()`**: Retrieves the current user session information.
*   **`onAuthStateChange(callback)`**: Listens for changes in the user's authentication state.

## 2. User Profile

*   **`getUserProfile()`**: Fetches the profile data (name, email, wallet balance, subscription status, etc.) associated with the currently logged-in user. Requires RLS to ensure users can only fetch their own data.
    *   *Database Interaction:* `SELECT * FROM profiles WHERE user_id = auth.uid() LIMIT 1`
*   **`updateUserProfile(name, ...other_fields)`**: Updates mutable fields in the user's profile. Requires RLS.
    *   *Database Interaction:* `UPDATE profiles SET name = $1, ... WHERE user_id = auth.uid()`

## 3. Wallet & Credits

*   **`getUserWalletBalance()`**: Fetches the current credit balance for the logged-in user. (Could be part of `getUserProfile`).
    *   *Database Interaction:* `SELECT credits FROM profiles WHERE user_id = auth.uid() LIMIT 1`
*   **`redeemEVoucher(voucherCode)`**:
    1.  Validates the `voucherCode` against a `vouchers` table (checks existence, `is_used` status).
    2.  If valid, retrieves the voucher amount.
    3.  Updates the voucher record (`is_used = true`, `redeemed_by = auth.uid()`, `redeemed_at = now()`).
    4.  Increases the user's credit balance in the `profiles` table.
    5.  Creates a transaction record in a `transactions` table (type='deposit', description='E-Voucher Redeemed', amount, status='completed').
    *   *Database Interaction:* Requires multiple steps, potentially within a database function/transaction for atomicity.
*   **`recordIntendedCryptoDeposit(amount, coinType)`**: Records the user's intent to deposit crypto.
    *   *Database Interaction:* `INSERT INTO crypto_deposits (user_id, amount_usd, coin_type, status) VALUES (auth.uid(), $1, $2, 'pending_user_action')`
*   **`confirmCryptoPaymentSent(amount, coinType, txId [optional])`**: Records that the user claims to have sent the crypto. Updates the status of the intended deposit or creates a new record.
    *   *Database Interaction:* `UPDATE crypto_deposits SET status = 'pending_verification', tx_id = $3 WHERE user_id = auth.uid() AND amount_usd = $1 AND coin_type = $2 AND status = 'pending_user_action'` (or similar logic). Also creates a transaction record (type='deposit', description='Crypto Deposit (BTC/ETH/...)', amount, status='pending').
*   **`adminCreditUser(userId, amount, reason)`**: (Admin Function) Manually adds credits to a user's balance, typically after verifying a manual payment.
    *   *Database Interaction:* `UPDATE profiles SET credits = credits + $2 WHERE user_id = $1`. Creates a transaction record.
*   **`deductCredits(amount, reason)`**: Decreases the user's credit balance. Used internally by other functions (purchase course, subscribe, etc.). Checks for sufficient balance before deducting.
    *   *Database Interaction:* `UPDATE profiles SET credits = credits - $1 WHERE user_id = auth.uid() AND credits >= $1`. Creates a transaction record.
*   **`getTransactionHistory()`**: Fetches the transaction history for the logged-in user, ordered by date.
    *   *Database Interaction:* `SELECT * FROM transactions WHERE user_id = auth.uid() ORDER BY created_at DESC`

## 4. Trading Signals Subscription

*   **`purchaseSignalSubscription(tier, cost)`**:
    1.  Calls `deductCredits(cost, 'Signal Subscription - ' + tier + ' Days')`.
    2.  If successful, updates the user's profile or a separate `subscriptions` table with the new expiry date and active status.
    *   *Database Interaction:* Requires `deductCredits` call and `UPDATE profiles SET subscription_active = true, subscription_expiry = now() + interval '$1 days' WHERE user_id = auth.uid()` (adjust interval based on tier).
*   **`getSubscriptionStatus()`**: Fetches the user's current subscription status and expiry date (could be part of `getUserProfile`).
    *   *Database Interaction:* `SELECT subscription_active, subscription_expiry FROM profiles WHERE user_id = auth.uid() LIMIT 1`

## 5. Masterclasses & Courses

*   **`purchaseCourse(courseId, cost)`**:
    1.  Calls `deductCredits(cost, 'Course Purchase - ' + courseId)`.
    2.  If successful, records the user's enrollment/ownership in a `user_courses` table.
    *   *Database Interaction:* Requires `deductCredits` call and `INSERT INTO user_courses (user_id, course_id) VALUES (auth.uid(), $1)`
*   **`getUserCourses()`**: Fetches the list of courses the user has purchased/enrolled in.
    *   *Database Interaction:* `SELECT course_id FROM user_courses WHERE user_id = auth.uid()`

## 6. Copy Trading Service

*   **`purchaseCopyTradingContract(cost)`**:
    1.  Calls `deductCredits(cost, 'Copy Trading Contract Fee')`.
    2.  If successful, updates the user's profile or a `copy_trading_status` table to indicate the contract is purchased.
    *   *Database Interaction:* Requires `deductCredits` call and `UPDATE profiles SET copy_trading_contract_purchased = true WHERE user_id = auth.uid()` (or similar).
*   **`getCopyTradingStatus()`**: Fetches the user's copy trading contract status, KYC status, etc. (could be part of `getUserProfile`).
    *   *Database Interaction:* `SELECT copy_trading_contract_purchased, kyc_status, ... FROM profiles WHERE user_id = auth.uid() LIMIT 1`

## Potential Database Tables

*   `profiles`: Stores user-specific data linked to `auth.users` (name, email, credits, subscription status/expiry, copy trading status, kyc status).
*   `transactions`: Records all credit additions/deductions (user_id, timestamp, type, description, amount, status).
*   `vouchers`: Stores e-voucher codes, amounts, usage status (code, amount, is_used, redeemed_by, redeemed_at).
*   `crypto_deposits`: Tracks intended/pending crypto deposits (user_id, amount_usd, coin_type, status, tx_id, created_at, verified_at).
*   `user_courses`: Links users to purchased courses (user_id, course_id, purchased_at).
*   `courses`: Stores course details (id, name, description, cost).
*   `subscriptions`: (Alternative to storing in `profiles`) Tracks active subscriptions (user_id, type, expiry_date).

**Note:** This is a high-level overview. Actual implementation might involve Supabase Edge Functions for complex logic, database functions/triggers for atomicity, and careful setup of Row Level Security (RLS) policies to protect user data.