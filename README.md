# Payment System Architecture (Solidgame Platform)

This directory documents and provides utilities for the platform's payment infrastructure:
1. **Manual UPI & UTR Verification (Active - 0% Commission & No KYC)**
2. **Automated Payment Gateway Adapter (Ready for future scale - Cashfree / PayU)**

---

## 🚀 1. Active Method: Manual UPI + 12-Digit UTR Verification

### Deposit Flow (Pay-in):
1. **App Fetches Platform UPI**: When the user opens the "Add Funds" modal in the Android App, the app calls `GET /api/wallet/upi-details`.
2. **User Transfers INR**: The app displays the receiving UPI ID (e.g. `business@okhdfcbank`) with a 1-click **Copy UPI ID** button or **Pay via UPI App** intent.
3. **User Submits UTR**: After paying via PhonePe / GPay / Paytm, the user enters the 12-digit Bank Reference / UTR Number and clicks "Submit Deposit".
4. **Instant Admin Queue**: The request appears on the [Next.js Admin Console](http://localhost:3001) under **Deposit Approvals (UTR)** with status `PENDING`.
5. **Admin Approval**: The Admin checks their bank/UPI app, verifies the ₹ amount & UTR, and clicks **[Approve]**.
6. **Balance Credited**: The backend instantly adds funds to the user's available wallet balance and broadcasts a real-time WebSocket update to their mobile screen.

---

### Withdrawal Flow (Pay-out):
1. **User Enters UPI ID**: In the Android App "Withdraw" modal, the user inputs the amount and their personal UPI ID (e.g. `trader@okaxis`).
2. **Funds Locked**: The requested amount is immediately moved from `balance` into `lockedBalance` so it cannot be spent in active bets.
3. **Admin Payout**: The Admin views the request in the Admin Console under **Withdrawal Payouts (UPI)**, clicks **Copy UPI**, transfers the funds via their UPI app/bank, and clicks **[Mark Paid]**.
4. **Settled**: The funds are permanently deducted from `lockedBalance` and a `withdraw` transaction record is finalized.

---

## ⚡ 2. Automated Gateway Adapter (Cashfree / PayU)

When ready to automate deposits and instant IMPS/UPI payouts without manual intervention:
1. Configure credentials in `backend/.env`:
   ```env
   CASHFREE_APP_ID="your_cashfree_app_id"
   CASHFREE_SECRET_KEY="your_cashfree_secret_key"
   ```
2. Enable webhook endpoint `POST /api/payment/webhook`.
3. Cashfree will automatically process user UPI intents and credit balances upon receiving the webhook notification.
