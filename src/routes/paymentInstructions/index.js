const express = require("express");
const parseInstruction = require("@services/parser").parseInstruction;
const executeTransaction = require("@services/executor").executeTransaction;

const router = express.Router();

router.post("/", (req, res) => {
  try {
    const { accounts, instruction } = req.body;
    const parseResult = parseInstruction(instruction, accounts);
    if (parseResult.status_code !== "AP00" && parseResult.status_code !== "AP02") {
      return res.status(400).json(parseResult);
    }

    const response = executeTransaction(parseResult, accounts);
    return res.json(response);
  } catch (err) {
    return res.status(500).json({
      status_code: "SY03",
      status_reason: "Internal server error",
      error: err.message,
    });
  }
});

module.exports = router;     