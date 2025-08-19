import express from "express";

const PORT = process.env.PORT || 8080;
const app = express();
app.use(express.json()); 

app.get("/", (req, res) => {
    res.status(200).json({ success: true, message: "Server is running successfully" })
});

// In your route
app.post("/verify-apple", async (req, res) => {
    const { transactionReceipt } = req.body;

    console.log("data transactionReceipt:-", transactionReceipt);

    if (!transactionReceipt) {
        return res.status(400).json({ error: "Missing receipt" });
    }

    const result = await handleApplePurchase(transactionReceipt);

    console.log("data result:-", result);

    if (result.success) {
        res.status(200).json({ verified: true, data: result.data });
    } else {
        res.status(400).json({ verified: false, error: result.error });
    }
});

async function handleApplePurchase(receiptData) {
  // Try production first
  let result = await validateApplePurchase(receiptData, false);

  console.log("data validate", result);

  // If status = 21007 → retry with sandbox
  if (result.error === 21007) {
    console.log("⚠️ Sandbox receipt detected. Retrying with sandbox...");
    result = await validateApplePurchase(receiptData, true);
  }

  console.log("data final validate", result);
  return result;
}


async function validateApplePurchase(receiptData, isSandbox = true) {
  const endpoint = isSandbox
    ? "https://sandbox.itunes.apple.com/verifyReceipt"
    : "https://buy.itunes.apple.com/verifyReceipt";

    console.log("data endpoint", endpoint);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "receipt-data": receiptData.trim(),
        "password": "c6b07bf7b665437ab7c0be7bb26eb931",
        // "exclude-old-transactions": true,
      }),
    });

    const result = await response.json();

    console.log("data result", result);

    if (result.status === 0) {
      console.log("✅ Purchase verified:", result);
      return { success: true, data: result };
    } else {
      console.error("❌ Apple verification error:", result.status, result);
      return { success: false, error: result.status, data: result };
    }
  } catch (err) {
    console.error("🚨 Network/Server error verifying Apple purchase:", err);
    return { success: false, error: "server_error", details: err.message };
  }
}


app.listen(PORT, () => {
    console.log("app running on ", PORT);
})