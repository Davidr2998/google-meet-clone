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
  console.log("message added to channel");
  console.log(message.author, message.body);
}

const messageInput = document.getElementById("message-input");
const chatButton = document.getElementById("chat-button");

chatButton.addEventListener("click", () => {
  generalChannel.sendMessage(messageInput.value);
  messageInput.value = "";
});

window.addEventListener("beforeunload", disconnect);
