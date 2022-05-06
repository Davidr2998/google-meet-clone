const $ = (selector) => document.querySelector(selector);

const $count = $("#participant-counter");
const $container = $("#participant-list");

let connected = false;
const username = sessionStorage.getItem("username")
  ? sessionStorage.getItem("username")
  : (window.location = "index.html");
let meetingRoom;

let ismuted = false;
let cameraDisabled = false;

function meetingControls() {
  const controlDiv = document.createElement("div");
  const controlTemplate = `
  <button id="mute-button" class="button" onclick="muteAudio()">
    <img src="../static/mute.svg" alt="mute">
  </button>
  <button id="video-button" class="button">
    <img src="../static/disable-camera.svg" alt="mute" onclick="disableVideo()">  
  </button>
  <button id="disconnect-button" class="button disconnect" onclick="disconnectFromMeeting()">
    <img src="../static/disconnect.svg" alt="mute">
  </button>
  `;
  controlDiv.innerHTML = controlTemplate;
  controlDiv.classList.add("meeting-controls");

  return controlDiv;
}

async function addLocalVideo() {
  const $localVideo = $("#local-video");
  const track = await Twilio.Video.createLocalVideoTrack();
  $localVideo.appendChild(track.attach()).classList.add("video-webcam");
  const controls = meetingControls();
  $localVideo.appendChild(controls);
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
  const $video = $(`#participant-${participant.sid} .participant-video`);

  $video.appendChild(track.attach()).classList.add("participant-video");
}

async function detachTrack(track) {
  await track.detach();
  updateParticipantCount();
}

function participantDisconnected(participant) {
  const participantVideo = $(`#participant-${participant.sid}`);
  participantVideo.remove();
  console.log("participant disconnected");
}

function muteAudio() {
  /* console.log(meetingRoom); */
  const muteButton = $("#mute-button");
  meetingRoom.localParticipant.audioTracks.forEach(({ track }) => {
    if (ismuted) {
      track.enable();
      ismuted = false;
      muteButton.classList.remove("disconnect");
    } else {
      track.disable();
      ismuted = true;
      muteButton.classList.add("disconnect");
    }
  });
}

function disconnectFromMeeting() {
  disconnect();
  window.location = "index.html";
}

function disableVideo() {
  const videoButton = $("#video-button");
  meetingRoom.localParticipant.videoTracks.forEach(({ track }) => {
    if (cameraDisabled) {
      track.enable();
      cameraDisabled = false;
      videoButton.classList.remove("disconnect");
    } else {
      track.disable();
      cameraDisabled = true;
      videoButton.classList.add("disconnect");
    }
  });
}
