import { DiscordSDK } from "@discord/embedded-app-sdk";
import axios from 'axios';
import rocketLogo from '/rocket.png';
import "./style.css";

let auth;
let discordSdk;

async function initializeDiscordSdk() {
  if (window.location.search.includes('frame_id')) {
    discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
    await discordSdk.ready();

    await setupDiscordSdk();
    console.log("Discord SDK is authenticated");
    appendVoiceChannelName();
    appendGuildAvatar();
    fetchAndDisplayPosts();
  } else {
    console.warn("Discord SDK is not initialized as it's not running in Discord.");
  }
}

// Setup and authenticate with Discord SDK
async function setupDiscordSdk() {
  await discordSdk.ready();
  console.log("Discord SDK is ready");

  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: [
      "identify",
      "guilds",
      "applications.commands"
    ],
  });

  const response = await fetch("/.proxy/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  const { access_token } = await response.json();
  auth = await discordSdk.commands.authenticate({ access_token });

  if (auth == null) {
    throw new Error("Authenticate command failed");
  }
}

// Append the name of the voice channel to the page
async function appendVoiceChannelName() {
  const app = document.querySelector('#app');
  let activityChannelName = 'Unknown';

  if (discordSdk.channelId != null && discordSdk.guildId != null) {
    const channel = await discordSdk.commands.getChannel({ channel_id: discordSdk.channelId });
    if (channel.name != null) {
      activityChannelName = channel.name;
    }
  }

  const textTagString = `Activity Channel: "${activityChannelName}"`;
  const textTag = document.createElement('p');
  textTag.textContent = textTagString;
  app.appendChild(textTag);
}

// Append guild avatar to the page
async function appendGuildAvatar() {
  const app = document.querySelector('#app');
  const guilds = await axios.get('https://discord.com/api/v10/users/@me/guilds', {
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json',
    },
  }).then((response) => response.data);

  const currentGuild = guilds.find((g) => g.id === discordSdk.guildId);

  if (currentGuild != null) {
    const guildImg = document.createElement('img');
    guildImg.setAttribute('src', `https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.webp?size=128`);
    guildImg.setAttribute('width', '128px');
    guildImg.setAttribute('height', '128px');
    guildImg.setAttribute('style', 'border-radius: 50%;');
    app.appendChild(guildImg);
  }
}

// Function to fetch and display posts from an external API
async function fetchAndDisplayPosts() {
  try {
    const response = await axios.get("/.proxy/api/posts", {
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
    });
    const posts = response.data;

    console.log('Posts fetched:', posts);

    const app = document.querySelector('#app');
    if (!app) {
      console.error("App container not found");
      return;
    }

    const postContainer = document.createElement('div');
    postContainer.setAttribute('id', 'posts');

    posts.forEach(post => {
      const postElement = document.createElement('div');
      postElement.classList.add('post');
      postElement.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.body}</p>
      `;
      postContainer.appendChild(postElement);
    });

    app.appendChild(postContainer);
  } catch (error) {
    console.error('Error fetching posts:', error);
    const app = document.querySelector('#app');
    const errorMessage = document.createElement('div');
    errorMessage.textContent = 'Failed to load posts.';
    app.appendChild(errorMessage);
  }
}
// Load the DOM and set up event listeners and UI
document.addEventListener("DOMContentLoaded", async () => {
  const app = document.querySelector('#app');
  app.innerHTML = `
    <div>
      <img src="${rocketLogo}" class="logo" alt="Discord" />
      <h1>Hello, World!</h1>
      <button id="showPopupButton">Click Me!</button>
      <div id="customPopup" class="modal" style="display: none;">
        <div class="modal-content">
          <span class="close" id="closePopup">&times;</span>
          <p class="title">This is a custom pop-up!</p>
        </div>
      </div>
    </div>
  `;

  // Show pop-up button functionality
  document.getElementById('showPopupButton').onclick = function() {
    document.getElementById('customPopup').style.display = 'block';
  };

  // Close pop-up button functionality
  document.getElementById('closePopup').onclick = function() {
    document.getElementById('customPopup').style.display = 'none';
  };

  // Initialize Discord SDK and fetch posts
  await initializeDiscordSdk();
});
