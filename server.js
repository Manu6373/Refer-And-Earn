const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Home
app.get("/", (req, res) => {
  res.send("Refer & Earn Ads Backend is Running!");
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    service: "Refer & Earn Ads Backend"
  });
});

// Existing AdsGram route - preserved
app.get("/ad/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!/^\d+$/.test(userId)) {
      return res.status(400).json({
        error: "Invalid Telegram User ID"
      });
    }

    const token = process.env.ADSGRAM_TOKEN;
    const blockId = process.env.ADSGRAM_BLOCK_ID;

    if (!token || !blockId) {
      return res.status(503).json({
        error: "AdsGram configuration incomplete"
      });
    }

    const url = new URL("https://api.adsgram.ai/advbot");

    url.searchParams.set("tgid", userId);
    url.searchParams.set("blockid", blockId);
    url.searchParams.set("language", "en");
    url.searchParams.set("token", token);

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(502).json({
        error: "AdsGram API unavailable"
      });
    }

    const ad = await response.json();
    res.json(ad);

  } catch (error) {
    console.error("AdsGram error:", error);
    res.status(500).json({
      error: "Internal server error"
    });
  }
});

// NEW: RichAds integration
app.get("/richads/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!/^\d+$/.test(userId)) {
      return res.status(400).json({
        error: "Invalid Telegram User ID"
      });
    }

    const publisherId = process.env.RICHADS_PUBLISHER_ID;

    if (!publisherId) {
      return res.status(503).json({
        error: "RichAds Publisher ID missing"
      });
    }

    const response = await fetch(
      "http://15068.xml.adx1.com/telegram-mb",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          language_code: "en",
          publisher_id: publisherId,
          telegram_id: userId,
          production: false
        })
      }
    );

    const responseText = await response.text();

    let ads;

    try {
      ads = JSON.parse(responseText);
    } catch {
      return res.status(502).json({
        error: "Invalid RichAds response"
      });
    }

    res.status(response.status).json({
      status: response.status,
      ads: ads
    });

  } catch (error) {
    console.error("RichAds error:", error);

    res.status(500).json({
      error: "RichAds connection failed"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
