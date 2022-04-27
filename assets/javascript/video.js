const $ = (selector) => document.querySelector(selector);

const $container = $("#participant-list");

let connected = false;
const username = sessionStorage.getItem("username")
  ? sessionStorage.getItem("username")
  : (window.location = "homepage.html");
let meetingRoom;

async function addLocalVideo() {
  const $localVideo = document.getElementById("local-video");
  const $participantContainer = document.getElementById(
    "participant-container"
  );
  const track = await Twilio.Video.createLocalVideoTrack();
  /* $localVideo.appendChild(track.attach()).classList.add("video-webcam"); */
  $localVideo
    .insertBefore(track.attach(), $participantContainer)
    .classList.add("video-webcam");
}

addLocalVideo();

const start = async () => {
  if (connected) {
    disconnect();
    return;
  }

  if (!username) return alert("Please provide an username");

  try {
    await connect({ username });
  } catch (e) {
    console.error(e);
    alert("Failed to connect");
  }
};

start();

async function connect({ username }) {
  const response = await fetch("/get_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  const data = await response.json();
  meetingRoom = await Twilio.Video.connect(data.token);
  console.log("conected");
  meetingRoom.participants.forEach(participantConnected);
  meetingRoom.on("participantConnected", participantConnected);
  meetingRoom.on("participantDisconnected", participantDisconnected);
  connected = true;
  updateParticipantCount();
}

function disconnect() {
  meetingRoom.disconnect();
  // quitar la cámara de los divs
  connected = false;
  updateParticipantCount();
}

function updateParticipantCount() {
  console.log(`${meetingRoom.participants.size + 1} online users`);
  /* $count.innerHTML = `${meetingRoom.participants.size + 1} online users`; */
}

async function participantConnected(participant) {
  const template = `<div id='participant-${participant.sid}' class="participant">
              <div class="participant-video"></div>
              <div class="participant-name">
                <span>${participant.identity}</span>
              </div>
            </div>`;

  // $videoParticipants.innerHTML += template;
  $container.insertAdjacentHTML("beforeend", template);

  console.log("KILL ME PLS", participant.tracks);

  participant.tracks.forEach((localTrackPublication) => {
    const { isSubscribed, track } = localTrackPublication;
    if (isSubscribed) attachTrack(track);
  });

  participant.on("trackSubscribed", attachTrack);
  participant.on("trackUnsubscribed", (track) => track.detach());
  updateParticipantCount();
}

function attachTrack(track) {
  console.log("user track", track);
  const $video = $container.querySelector(
    `.participant:last-child .participant-video`
  );

  console.log("TEST", $video);
  $video.appendChild(track.attach()).classList.add("participant-video");
}

function participantDisconnected(participant) {
  console.log("participant disconnected");
}
