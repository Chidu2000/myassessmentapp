const executeTransaction = (parsed, accounts) => {
  const { debit_account, credit_account, amount, _, status } = parsed;
  const debitAcc = accounts.find((a) => a.id === debit_account);

  let updatedAccounts = accounts.map((a) => ({ ...a, balance_before: a.balance }));

  if (status === "successful") {
    if (debitAcc.balance < amount) {
      return {
        status_code: "AC01",
        status_reason: `Insufficient funds in account ${debit_account}`,
      };
    }

    updatedAccounts = accounts.map((acc) => {
      if (acc.id === debit_account) {
        return { ...acc, balance_before: acc.balance, balance: acc.balance - amount };
      }
      if (acc.id === credit_account) {
        return { ...acc, balance_before: acc.balance, balance: acc.balance + amount };
      }
      return { ...acc, balance_before: acc.balance };
    });
  }

  return {
    ...parsed,
    accounts: updatedAccounts,
  };
};

module.exports = {
  executeTransaction,
};
