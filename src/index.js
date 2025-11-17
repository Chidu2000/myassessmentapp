
require('module-alias/register');
const express = require("express");
const paymentInstructionsRouter = require("@routes/paymentInstructions");

const app = express();
app.use(express.json());

app.use("/payment-instructions", paymentInstructionsRouter);

app.get("/", (req, res) => {
  res.json({ message: "Payment Instruction Parser API" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});


module.exports = app;

