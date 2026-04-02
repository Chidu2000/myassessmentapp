# Payment Instruction Parser API

Node.js + Express service that parses natural-language payment instructions, validates them, and simulates account balance updates.

This project is focused on:
- Instruction parsing
- Validation and status code generation
- Transaction execution (or scheduling state)

## Tech Stack

- Node.js
- Express
- CommonJS modules


## WorkFlow

Request flow:
1. Client sends `accounts` + `instruction` to `POST /payment-instructions`.
2. `parseInstruction(...)` validates syntax, amount, currency, account IDs, account existence, and optional date.
3. If parse status is success (`AP00`) or pending (`AP02`), `executeTransaction(...)` runs.
4. Response includes status metadata and (when execution is possible) updated account balances.

## API

### Health Endpoint

- `GET /`
- Response:

```json
{
  "message": "Payment Instruction Parser API"
}
```

### Parse + Execute Endpoint

- `POST /payment-instructions`
- Request body:

```json
{
  "instruction": "DEBIT 100 USD FROM ACCOUNT ACC-001 TO ACCOUNT ACC-002 ON 2026-04-10",
  "accounts": [
    { "id": "ACC-001", "currency": "USD", "balance": 1000 },
    { "id": "ACC-002", "currency": "USD", "balance": 200 }
  ]
}
```

## Supported Instruction Formats

The parser supports both command types:

1. `DEBIT <amount> <currency> FROM ACCOUNT <debitId> TO ACCOUNT <creditId> [ON YYYY-MM-DD]`
2. `CREDIT <amount> <currency> TO ACCOUNT <creditId> FROM ACCOUNT <debitId> [ON YYYY-MM-DD]`

Notes:
- Amount must be a positive integer (no decimals).
- Supported currencies: `USD`, `NGN`, `GBP`, `GHS`.
- Date is optional.

## Example Responses

### 1) Immediate successful execution (`AP00`)

Request:

```json
{
  "instruction": "DEBIT 100 USD FROM ACCOUNT ACC-001 TO ACCOUNT ACC-002",
  "accounts": [
    { "id": "ACC-001", "currency": "USD", "balance": 1000 },
    { "id": "ACC-002", "currency": "USD", "balance": 200 }
  ]
}
```

Response:

```json
{
  "type": "DEBIT",
  "amount": 100,
  "currency": "USD",
  "debit_account": "ACC-001",
  "credit_account": "ACC-002",
  "execute_by": null,
  "status": "successful",
  "status_code": "AP00",
  "status_reason": "Transaction executed successfully",
  "accounts": [
    { "id": "ACC-001", "currency": "USD", "balance": 900, "balance_before": 1000 },
    { "id": "ACC-002", "currency": "USD", "balance": 300, "balance_before": 200 }
  ]
}
```

### 2) Future-dated instruction (`AP02`) -> pending

Request:

```json
{
  "instruction": "DEBIT 100 USD FROM ACCOUNT ACC-001 TO ACCOUNT ACC-002 ON 2026-12-01",
  "accounts": [
    { "id": "ACC-001", "currency": "USD", "balance": 1000 },
    { "id": "ACC-002", "currency": "USD", "balance": 200 }
  ]
}
```

Response (status pending, balances unchanged but annotated):

```json
{
  "type": "DEBIT",
  "amount": 100,
  "currency": "USD",
  "debit_account": "ACC-001",
  "credit_account": "ACC-002",
  "execute_by": "2026-12-01",
  "status": "pending",
  "status_code": "AP02",
  "status_reason": "Transaction scheduled for future execution",
  "accounts": [
    { "id": "ACC-001", "currency": "USD", "balance": 1000, "balance_before": 1000 },
    { "id": "ACC-002", "currency": "USD", "balance": 200, "balance_before": 200 }
  ]
}
```

### 3) Business failure: insufficient funds (`AC01`)

Request:

```json
{
  "instruction": "DEBIT 5000 USD FROM ACCOUNT ACC-001 TO ACCOUNT ACC-002",
  "accounts": [
    { "id": "ACC-001", "currency": "USD", "balance": 300 },
    { "id": "ACC-002", "currency": "USD", "balance": 200 }
  ]
}
```

Response:

```json
{
  "status_code": "AC01",
  "status_reason": "Insufficient funds in account ACC-001"
}
```

## Status Codes

### Parsing / Validation

- `SY01`: Missing required keyword(s)
- `SY02`: Invalid keyword order
- `SY03`: Malformed instruction or internal server error wrapper
- `AM01`: Invalid amount
- `CU02`: Unsupported currency
- `DT01`: Invalid date format
- `AC02`: Debit and credit accounts are the same
- `AC03`: Account not found
- `AC04`: Invalid account ID format
- `CU01`: Currency mismatch

### Processing Outcome

- `AP00`: Transaction executed successfully
- `AP02`: Transaction scheduled for future execution
- `AC01`: Insufficient funds in debit account

## Run Locally

### Prerequisites

- Node.js 18+ (recommended)

### Install and start

```bash
npm install
npm start
```

Server starts on:
- `http://localhost:3000`

## Run with Docker

```bash
docker build -t payment-instruction-parser .
docker run -p 3000:3000 payment-instruction-parser
```

