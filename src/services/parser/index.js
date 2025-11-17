
const SUPPORTED_CURRENCIES = require("@validators/instructionSchema").SUPPORTED_CURRENCIES;
const validAccountId = require("@validators/instructionSchema").validAccountId;

function isValidDateFormat(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return false;
  if (dateStr.length !== 10) return false;

  if (dateStr[4] !== "-" || dateStr[7] !== "-") return false;

  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(5, 7);
  const day = dateStr.substring(8, 10);

  for (let c of year + month + day) {
    if (c < "0" || c > "9") return false;
  }

  const mm = Number(month);
  const dd = Number(day);

  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;

  return true;
}

function normalizeSpaces(str) {
  if (!str) return "";

  let cleaned = "";
  let prevSpace = false;

  for (const ch of str.trim()) {
    if (ch === " ") {
      if (!prevSpace) {
        cleaned += " ";
        prevSpace = true;
      }
    } else {
      cleaned += ch;
      prevSpace = false;
    }
  }

  return cleaned;
}


const parseInstruction = (instruction, accounts) => {
  if (!instruction || !accounts) {
    return { status_code: "SY03", status_reason: "Malformed instruction" };
  }

  // const text = instruction.trim().replace(/\s+/g, " ");
  const text = normalizeSpaces(instruction);
  const parts = text.split(" ");
  const type = parts[0]?.toUpperCase();

  if (type !== "DEBIT" && type !== "CREDIT") {
    return { status_code: "SY01", status_reason: "Missing required keyword" };
  }

  // ----------- FIXED DECIMAL VALIDATION ----------------------
  const amountStr = parts[1];

  if (!amountStr || isNaN(amountStr)) {
    return { status_code: "AM01", status_reason: "Invalid amount" };
  }

  // Reject decimals
  if (amountStr.includes(".")) {
    return { status_code: "AM01", status_reason: "Amount must be a positive integer (no decimals)" };
  }

  const amount = Number(amountStr);

  if (amount <= 0) {
    return { status_code: "AM01", status_reason: "Invalid amount" };
  }
  // ------------------------------------------------------------

  const currency = parts[2]?.toUpperCase();

  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    return { status_code: "CU02", status_reason: "Unsupported currency" };
  }

  let debitAcc, creditAcc, executeDate = null;
  const today = new Date().toISOString().split("T")[0];

  try {
    if (type === "DEBIT") {
      // find FROM (case insensitive)
      const fromIdx = parts.findIndex(p => p.toUpperCase() === "FROM");
      if (fromIdx === -1) return { status_code: "SY01", status_reason: "Missing required keywords" };

      // find ACCOUNT after FROM
      let acctIdx = parts.slice(fromIdx + 1).findIndex(p => p.toUpperCase() === "ACCOUNT");
      if (acctIdx === -1) return { status_code: "SY01", status_reason: "Missing required keyword" };
      acctIdx = acctIdx + fromIdx + 1;

      debitAcc = parts[acctIdx + 1];

      // find TO
      const toIdx = parts.findIndex(p => p.toUpperCase() === "TO");
      if (toIdx === -1) return { status_code: "SY01", status_reason: "Missing required keyword" };

      // find ACCOUNT after TO
      let creditAcctIdx = parts.slice(toIdx + 1).findIndex(p => p.toUpperCase() === "ACCOUNT");
      if (creditAcctIdx === -1) return { status_code: "SY01", status_reason: "Missing required keyword" };
      creditAcctIdx = creditAcctIdx + toIdx + 1;

      creditAcc = parts[creditAcctIdx + 1];

    } else {
      // CREDIT flow

      const toIdx = parts.findIndex(p => p.toUpperCase() === "TO");
      if (toIdx === -1) return { status_code: "SY01", status_reason: "Missing required keyword" };

      let acctIdx = parts.slice(toIdx + 1).findIndex(p => p.toUpperCase() === "ACCOUNT");
      if (acctIdx === -1) return { status_code: "SY01", status_reason: "Missing required keyword" };
      acctIdx = acctIdx + toIdx + 1;

      creditAcc = parts[acctIdx + 1];

      const fromIdx = parts.findIndex(p => p.toUpperCase() === "FROM");
      if (fromIdx === -1) return { status_code: "SY01", status_reason: "Missing required keyword" };

      let debitAcctIdx = parts.slice(fromIdx + 1).findIndex(p => p.toUpperCase() === "ACCOUNT");
      if (debitAcctIdx === -1) return { status_code: "SY01", status_reason: "Missing required keyword" };
      debitAcctIdx = debitAcctIdx + fromIdx + 1;

      debitAcc = parts[debitAcctIdx + 1];
    }

    // Optional date
    const onIdx = parts.findIndex(p => p.toUpperCase() === "ON");
    if (onIdx !== -1 && onIdx + 1 < parts.length) {
      executeDate = parts[onIdx + 1];
      if (!isValidDateFormat(executeDate)) {
        return { status_code: "DT01", status_reason: "Invalid date format" };
      }
    }

  } catch (err) {
    return { status_code: "SY02", status_reason: "Invalid keyword order" };
  }

  if (!debitAcc || !creditAcc) {
    return { status_code: "SY01", status_reason: "Missing required keywords or malformed instruction" };
  }

  if (debitAcc === creditAcc) {
    return { status_code: "AC02", status_reason: "Debit and credit accounts cannot be the same" };
  }

  if (!validAccountId(debitAcc) || !validAccountId(creditAcc)) {
    return { status_code: "AC04", status_reason: "Invalid account ID format" };
  }

  const debitAccount = accounts.find(a => a.id === debitAcc);
  const creditAccount = accounts.find(a => a.id === creditAcc);

  if (!debitAccount || !creditAccount) {
    return { status_code: "AC03", status_reason: "Account not found" };
  }

  if (debitAccount.currency.toUpperCase() !== creditAccount.currency.toUpperCase()) {
    return { status_code: "CU01", status_reason: "Currency Mismatch" };
  }

  if (debitAccount.currency.toUpperCase() !== currency) {
    return { status_code: "CU01", status_reason: "Currency mismatch in instruction" };
  }

  // Status logic
  let status = "successful";
  let status_code = "AP00";
  let status_reason = "Transaction executed successfully";

  if (executeDate && executeDate > today) {
    status = "pending";
    status_code = "AP02";
    status_reason = "Transaction scheduled for future execution";
  }

  return {
    type,
    amount,
    currency: currency.toUpperCase(),
    debit_account: debitAcc,
    credit_account: creditAcc,
    execute_by: executeDate || null,
    status,
    status_code,
    status_reason,
  };
};

module.exports = { parseInstruction };
