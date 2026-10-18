# WiselyS
A simple, mobile-first budgeting web app. Set a budget, log expenses in seconds, and see what’s left update instantly.
Live app: https://saminshahi.github.io/WiselyS/
## Features
 • Set a daily, weekly or monthly budget (default currency: TRY ₺)
 • Add, edit and delete expenses (amount and category required, description optional)
 • Dashboard with total, spent, remaining, percent used, a progress bar and over-budget warnings
 • Expense history, newest first, filterable by category and date
 • Simple insights: spending by category and daily spending chart
 • Data saved in your browser (localStorage), so it survives refreshes and restarts
Run locally
No install or build step. Download the repo and open index.html in a browser.
## Files

| File | Purpose | 
| --- | --- |
| index.html | Page Structure and dialogs |
| style.css | Styling, including dark mode |
| app.js | Budget logic, storage and rendering |
## Deploy
Hosted with GitHub Pages: Settings → Pages → Deploy from a branch → main / (root).
## Notes
 • Data is stored per browser and device. Clearing browser data deletes your expenses.
 • Currency is a display label only; amounts are not converted.
 • Money is stored as integer minor units (e.g. 4550 = 45.50) to avoid rounding errors.
 • Out of scope for v1: bank integrations, payments, subscriptions, AI advice, accounts.

