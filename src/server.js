import express from "express";

const PORT = process.env.PORT || 8080;
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res
    .status(200)
    .json({ success: true, message: "Server is running successfully" });
});

// Apple IAP verification route
app.post("/verify-apple", async (req, res) => {
  const { transactionReceipt } = req.body;
  console.log("data transactionReceipt:-", transactionReceipt);

  if (!transactionReceipt) {
    return res.status(400).json({ verified: false, error: "Missing receipt" });
  }

  try {
    const result = await handleApplePurchase(transactionReceipt);
    console.log("data result:-", result);

    if (result.success) {
      return res.status(200).json({ verified: true, data: result.data });
    } else {
      return res
        .status(400)
        .json({ verified: false, error: result.error, details: result.data });
    }
  } catch (err) {
    console.error("🚨 Verification failed:", err);
    return res
      .status(500)
      .json({ verified: false, error: "server_error", details: err.message });
  }
});

// First try production, then retry sandbox if 21007
async function handleApplePurchase(receiptData) {
  let result = await validateApplePurchase(receiptData, false); // prod first
  console.log("data validate", result);

  if (result.data?.status === 21007) {
    console.log("⚠️ Sandbox receipt detected. Retrying with sandbox...");
    result = await validateApplePurchase(receiptData, true);
  }
  console.log("data final validate", result);

  return result;
}

async function validateApplePurchase(receiptData, isSandbox = false) {
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
        // "password": process.env.APP_SHARED_SECRET,
        password: "c6b07bf7b665437ab7c0be7bb26eb931",
        "exclude-old-transactions": true,
      }),
    });

    const result = await response.json();
    console.log("data result", result);

    if (result.status === 0) {
      console.log("✅ Purchase verified:", result);

      const latest = result.latest_receipt_info?.[0] || {};

      return {
        success: true,
        data: {
          productId: latest.product_id,
          transactionId: latest.transaction_id,
          purchaseDate: latest.purchase_date_ms,
          originalTransactionId: latest.original_transaction_id,
        },
      };
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
  console.log("✅ App running on port", PORT);
});
