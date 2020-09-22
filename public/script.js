const socket = io("/");
const videoGrid = document.getElementById("video-grid");
let msg = document.getElementById("chat-message");
const ul = document.querySelector(".messages");
const microphone = document.getElementById("microphone");
const video = document.getElementById("video");
const muteBtn = document.getElementById("mute-btn");
const muteSpan = document.getElementById("mute-span");
const stopButton = document.getElementById("stop-video");
const stopSpan = document.getElementById("span-stopVideo");
// const myPeer = new Peer(undefined, {
//   host: "/",
//   port: "3001",
// });

const myPeer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});

const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
}).then((stream) => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream);

  myPeer.on("call", (call) => {
    call.answer(stream);
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
      addVideoStream(video, userVideoStream);
    });
  });

  socket.on("user-connected", (userId) => {
    connectToNewUser(userId, stream);
  });
});

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

function textInput(e) {
  socket.emit("message", msg.value);
  // console.log("message: ", msg.value);
  msg.value = "";
}

socket.on("createMessage", (message, userId) => {
  console.log("this is comming from server: ", message, userId);
  const strong = document.createElement("strong");
  strong.textContent = userId;
  const li = document.createElement("li");
  li.textContent = message;
  ul.append(strong, li);
});

// Mute our video
const muteUnmute = () => {
  let enabled = myVideoStream.getAudioTracks()[0].enabled;

  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;

    muteBtn.classList.replace("fa-microphone", "fa-microphone-slash");
    muteBtn.setAttribute("title", "Unmute");
    muteSpan.textContent = "Unmute";
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    muteBtn.classList.replace("fa-microphone-slash", "fa-microphone");
    muteBtn.setAttribute("title", "mute");
    muteSpan.textContent = "Mute";
  }
};

// Stop or Play our Video
const stopPlayVideo = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;

  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    stopButton.classList.replace("fa-video", "fa-video-slash");
    stopButton.setAttribute("title", "Play");
    stopSpan.textContent = "Play video";
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    stopButton.classList.replace("fa-video-slash", "fa-video");
    stopButton.setAttribute("title", "Stop");
    stopSpan.textContent = "Stop video";
  }
};

msg.addEventListener("change", textInput);
microphone.addEventListener("click", muteUnmute);
video.addEventListener("click", stopPlayVideo);
