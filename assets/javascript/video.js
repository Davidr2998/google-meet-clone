const $ = (selector) => document.querySelector(selector);

const $count = $("#participant-counter");
const $container = $("#participant-list");

let connected = false;
const username = sessionStorage.getItem("username")
  ? sessionStorage.getItem("username")
  : (window.location = "index.html");
let meetingRoom;

async function addLocalVideo() {
  const $localVideo = document.querySelector("#local-video");
  const $participantContainer = document.querySelector(
    "#participant-container"
  );
  const track = await Twilio.Video.createLocalVideoTrack();
  $localVideo
    .insertBefore(track.attach(), $participantContainer)
    .classList.add("video-webcam");
}

addLocalVideo();

const start = async () => {
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
  $count.innerHTML = `${meetingRoom.participants.size + 1} online users`;
}

function participantConnected(participant) {
  const template = `<div id='participant-${participant.sid}' class="participant">
              <div class="participant-video"></div>
              <div class="participant-name">
                <span>${participant.identity}</span>
              </div>
            </div>`;

  $container.insertAdjacentHTML("beforeend", template);

  participant.tracks.forEach((localTrackPublication) => {
    const { isSubscribed, track } = localTrackPublication;
    if (isSubscribed) attachTrack(track);
  });

  participant.on("trackSubscribed", (track) => attachTrack(track, participant));
  participant.on("trackUnsubscribed", (track) => detachTrack(track));
  updateParticipantCount();
}

function attachTrack(track, participant) {
  const $video = $container.querySelector(
    `#participant-${participant.sid} .participant-video`
  );

  $video.appendChild(track.attach()).classList.add("participant-video");
}

async function detachTrack(track) {
  await track.detach();
  updateParticipantCount();
}

function participantDisconnected(participant) {
  const participantVideo = document.querySelector(
    `#participant-${participant.sid}`
  );
  participantVideo.remove();
  console.log("participant disconnected");
}
