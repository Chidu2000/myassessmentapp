const SUPPORTED_CURRENCIES = ["USD", "NGN", "GBP", "GHS"];

const validAccountId = (id) => {
  if (!id || typeof id !== "string") return false;

  for (let i = 0; i < id.length; i++) {
    const c = id[i];

    const isLetter =
      (c >= "A" && c <= "Z") || (c >= "a" && c <= "z");

    const isDigit = c >= "0" && c <= "9";

    const isSpecial = c === "-" || c === "." || c === "@";

    if (!isLetter && !isDigit && !isSpecial) return false;
  }

  return true;
};

module.exports = {
  SUPPORTED_CURRENCIES,
  validAccountId,
};
