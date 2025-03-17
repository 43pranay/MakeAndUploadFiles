const express = require("express");
const { sendToQueue } = require("./producer");

const app = express();
app.use(express.json());

app.post("/make-and-upload", async (req, res) => {
  const { fileCount, fileSize, s3Destination } = req.body;

  if (!fileCount || !fileSize || !s3Destination) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  console.log(`Received request to create ${fileCount} files.`);

  const startTime = Date.now();
  for (let i = 0; i < fileCount; i++) {
    await sendToQueue({ fileIndex: i, fileSize, s3Destination });
  }

  res.json({ message: "Tasks created successfully", startedAt: startTime });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`App1 running on port ${PORT}`));
