# Wallet System Implementation Plan

This plan outlines the steps to integrate a Wallet/Credit system into the `profile.html` page.

## I. Modify `profile.html` Structure

1.  **Locate Profile Content:** Identify the main content area within `profile.html`.
2.  **Add Wallet Section:** Insert `<section class="wallet-section">` below primary profile details.
3.  **Wallet Section Content:**
    *   **Balance Display:** Add `<div class="wallet-balance">...</div>`.
    *   **Fund Wallet Subsection:** Create `<div class="fund-wallet">`.
        *   **E-Voucher:** Add form with input (`#voucher-code`) and button (`#redeem-voucher-btn`).
        *   **Crypto Deposit:** Add UI elements:
            *   Coin selector.
            *   Address display (`#crypto-deposit-address`).
            *   QR code (`#crypto-qr-code`).
            *   Instructions.
    *   **Transaction History Subsection:** Create `<div class="transaction-history">`.
        *   Add heading.
        *   Implement table or list.
        *   **Columns/Data Points:** Date, Type, Description, Amount, Status.
        *   Include placeholder entries.

## II. Update `style.css`

1.  **Wallet Section Styling:** Style `.wallet-section`.
2.  **Balance Styling:** Style `.wallet-balance`.
3.  **Funding UI Styling:** Style `.fund-wallet` and its contents.
4.  **Transaction History Styling:** Style `.transaction-history` table/list.
5.  **Status Styling:** Add styles for `.status-pending`, `.status-completed`, `.status-failed`.

## III. Update `script.js` (or `profile.html` script)

1.  **Balance Fetching:** Add placeholder JS function.
2.  **Voucher Redemption:** Add placeholder event listener for UI feedback.
3.  **Crypto Deposit:** Add placeholder logic for coin selection and address display.
4.  **History Fetching:** Add placeholder JS function.

## Visual Plan (Mermaid Diagram)

```mermaid
graph TD
    subgraph Profile Page (profile.html)
        A[User Details] --> B(Wallet Section);
        B --> C[Balance Display];
        B --> D(Fund Wallet);
        B --> E(Transaction History);

        D --> F[E-Voucher Input & Redeem Button];
        D --> G(Crypto Deposit UI);
        G --> G1[Coin Selector];
        G --> G2[Address/QR Display];

        E --> H[Transaction Table/List];
        H --> I[Columns: Date, Type, Desc, Amount, Status];
    end

    subgraph Styling (style.css)
        S1[Wallet Section Styles]
        S2[Balance Styles]
        S3[Funding UI Styles]
        S4[History Table/List Styles]
        S5[Status Indicator Styles]
    end

    subgraph Logic (script.js / profile.html script)
        L1[Fetch/Display Balance]
        L2[Handle Voucher Redeem (UI)]
        L3[Handle Crypto Deposit (UI)]
        L4[Fetch/Display History]
    end

    C --> L1;
    F --> L2;
    G --> L3;
    H --> L4;

    A --> S1;
    C --> S2;
    D --> S3;
    E --> S4;
    I --> S5;