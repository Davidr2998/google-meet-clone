const $ = (selector) => document.querySelector(selector);

const $userNameInput = $("#username");
const $form = $("#form");
const $joinButton = $("#join");

let connected = false;

$form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (connected) {
    disconnect();
    $joinButton.disabled = false;
    $joinButton.innerText = "Join the room";
    return;
  }

  const username = $userNameInput.value;
  if (!username) return alert("Please provide an username");
  sessionStorage.setItem("username", username);
  $joinButton.disabled = true;
  $joinButton.innerText = "Connecting...";
  try {
    await connect({ username });
    window.location = "meeting.html";
    $joinButton.disabled = false;
    $joinButton.innerText = "Leave the room";
  } catch (e) {
    console.error(e);
    alert("Failed to connect");
    $joinButton.disabled = false;
    $joinButton.innerText = "Join the room";
  }
});

async function connect({ username }) {
  const response = await fetch("/get_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  const data = await response.json();

  if (!data.token) {
    return;
  }

  connected = true;
}

function disconnect() {
  connected = false;
}
