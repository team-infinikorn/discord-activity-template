import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import axios from 'axios';
dotenv.config({ path: "../.env" });
import cors from 'cors';

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.post("/api/token", async (req, res) => {
  const response = await fetch(`https://discord.com/api/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.VITE_DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code: req.body.code,
    }),
  });

  const { access_token } = await response.json();
  res.send({access_token});
});

app.get('/api/posts', async (req, res) => {
  try {
    const response = await axios.get('https://jsonplaceholder.typicode.com/posts',);
    res.json(response.data);
  } catch (error) {
    res.status(500).send('Error fetching posts');
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
