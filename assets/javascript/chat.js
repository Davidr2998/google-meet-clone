let chatService;
let generalChannel;
let room;

const username = localStorage.getItem("username")
  ? localStorage.getItem("username")
  : "Anonymous";

async function connect({ username }) {
  const response = await fetch("/get_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  const data = await response.json();
  console.log(data);

  room = await Twilio.Chat.Client.create(data.token);
  console.log(room);
  chatClient = room;
  chatClient.getSubscribedChannels().then(joinGeneralChannel);

  /* room = await Twilio.Video.connect(data.token);
  room.participants.forEach(participantConnected);
  room.on("participantConnected", participantConnected);
  room.on("participantDisconnected", participantDisconnected);
  connected = true;
  updateParticipantCount(); */
}

connect({ username });

async function joinGeneralChannel() {
  console.log("attempting to join general channel");
  try {
    const channel = await chatClient.getChannelByUniqueName("miduroom");
    generalChannel = channel;
    console.log("found general chat");
    console.log(channel);
    setupChannel();
  } catch (error) {
    console.log("could not find general chat");
    const channel = await chatClient.createChannel({
      uniqueName: "miduroom",
      friendlyName: "General Chat",
    });
    console.log("Created general channel");
    console.log(channel);
    generalChannel = channel;
    setupChannel();
  }
}

function setupChannel() {
  generalChannel.join().then(function () {
    console.log(`joined as ${username}`);
  });
  generalChannel.on("messageAdded", messageAddedToChannel);
}

function messageAddedToChannel(message) {
  console.log("message added to channel");
  console.log(message.author, message.body);
}

const messageInput = document.getElementById("message-input");
const chatButton = document.getElementById("chat-button");

console.log(messageInput.value);

chatButton.addEventListener("click", () => {
  generalChannel.sendMessage(messageInput.value);
  messageInput.value = "";
});
