const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check
app.get("/", (req, res) => {
  res.send("Refer & Earn Ads Backend is Running!");
});

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    service: "AdsGram Reward Backend"
  });
});

// Get advertisement from AdsGram
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

    res.json({
      text_html: ad.text_html,
      click_url: ad.click_url,
      button_name: ad.button_name,
      image_url: ad.image_url,
      button_reward_name: ad.button_reward_name,
      reward_url: ad.reward_url
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
