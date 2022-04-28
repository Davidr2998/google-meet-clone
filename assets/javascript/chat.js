const messageList = document.querySelector("#chat-messages-list");

let chatService;
let generalChannel;
let room;

/* const username = localStorage.getItem("username")
  ? localStorage.getItem("username")
  : "Anonymous"; */

async function connect({ username }) {
  const response = await fetch("/get_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  const data = await response.json();

  room = await Twilio.Chat.Client.create(data.token);
  chatClient = room;
  await chatClient.getSubscribedChannels();
  joinGeneralChannel();
}

connect({ username });

async function joinGeneralChannel() {
  console.log("attempting to join general channel");
  try {
    const channel = await chatClient.getChannelByUniqueName("miduroom");
    generalChannel = channel;
    console.log("found general chat");
    setupChannel();
  } catch (error) {
    console.log("could not find general chat");
    const createGeneral = await chatClient.createChannel({
      uniqueName: "miduroom",
      friendlyName: "General Chat",
    });
    console.log("Created general channel");
    generalChannel = createGeneral;
    setupChannel();
  }
}

function setupChannel() {
  generalChannel.join().then(() => {
    console.log("joined channel");
  });
  generalChannel.on("messageAdded", messageAddedToChannel);
}

function disconnect() {
  generalChannel.leave().then(() => {
    console.log("left channel");
  });
}

function messageAddedToChannel(message) {
  const template = `<div class="message-card">
    <h4 class="message-card-author">${message.author}</h4>
    <p class="message-card-body">
      ${message.body}
    </p>
  </div>`;
  messageList.insertAdjacentHTML("beforeend", template);
  autoscroll();
}

/* chat input logic */

const messageInput = document.getElementById("message-input");
const chatButton = document.getElementById("chat-button");

chatButton.addEventListener("click", () => {
  if (messageInput.value === "") {
    return;
  }
  generalChannel.sendMessage(messageInput.value);
  messageInput.value = "";
});

messageInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    if (generalChannel === undefined) {
      alert(
        "The Chat Service is not configured. Please check your room has been configured."
      );
      return;
    }
    if (messageInput.value === "") {
      return;
    }
    generalChannel.sendMessage(messageInput.value);
    messageInput.value = "";
  }
});

window.addEventListener("beforeunload", disconnect);
/* End of chat input logic */

// Auto scroll script
function autoscroll() {
  const $newMessage = messageList.lastElementChild;
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin + 5;

  const visibleHeight = messageList.offsetHeight;

  const containerHeight = messageList.scrollHeight;

  const scrollOffset = messageList.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messageList.scrollTop = messageList.scrollHeight;
  }
}
