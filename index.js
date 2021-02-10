/**
 * We're going to fill in and add some methods here to implement
 * our "raise hand" feature.
 */

// This object lets us interact with the video call
let callFrame;
const raisedHands = new Set();

function toggleHandRaise() {
  const button = document.getElementById('toggle-hand-raise');

  if (raisedHands.has('local')) {
    raisedHands.delete('local');
    button.innerText = 'Raise hand';
  } else {
    raisedHands.add('local');
    button.innerText = 'Lower hand';
  }

  updateParticipantInfoDisplay();
}

// This method is called whenever we receive an 'app-message' event
function handleMessage(message) {
  // We'll fill this in a bit later
}

// This method is called whenever we receive a 'participant-updated' event
function handleParticipantUpdated(e) {
  updateParticipantInfoDisplay();
}

// Loop through each of the call participants and add their info to the page
function updateParticipantInfoDisplay(e) {
  if (e) {
    showEvent(e);
  }
  let meetingParticipantsInfo = document.getElementById(
      'meeting-participants-info'
    ),
    participants = callFrame.participants(),
    participantsList = '';

  for (var id in participants) {
    let p = participants[id];
    const handRaised = raisedHands.has(id) ? '| RAISED HAND' : '';
    participantsList += `
        <li>${p.user_name || 'Guest'} ${handRaised}</li>
    `;
  }
  meetingParticipantsInfo.innerHTML = participantsList;
}

/**
 * 🚧 You don't need to understand the code below here. This is all just
 * boilerplate required to get the Daily room set up, connect to it,
 * and some other things to make the demo run smoothly 🚧
 */

let room;

// Creates the callframe
// Defines event listeners on Daily events
// Assigns an event listener to the input field to change the join button color
async function setup() {
  callFrame = await window.DailyIframe.createFrame(
    document.getElementById('callframe'),
    {
      iframeStyle: {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '90%',
        border: '0'
      }
    }
  );

  callFrame
    .on('loaded', showEvent)
    .on('started-camera', showEvent)
    .on('camera-error', showEvent)
    .on('joining-meeting', showEvent)
    .on('joined-meeting', showCallDisplay)
    .on('recording-started', showEvent)
    .on('recording-stats', showEvent)
    .on('recording-error', showEvent)
    //👇 Call the `handleMessage` method whenever we receive the 'app-message' event
    .on('app-message', handleMessage)
    .on('input-event', showEvent)
    .on('error', showEvent)
    .on('participant-joined', updateParticipantInfoDisplay)
    //👇 Call the `handleParticipantUpdated` method whenever we receive the 'participant-updated' event
    .on('participant-updated', handleParticipantUpdated)
    .on('participant-left', updateParticipantInfoDisplay)
    .on('left-meeting', hideCallDisplay);

  let roomURL = document.getElementById('room-url');
  const joinButton = document.getElementsByClassName('join-call')[0];
  roomURL.addEventListener('input', () => {
    if (roomURL.checkValidity()) {
      joinButton.classList.add('valid');
    } else {
      joinButton.classList.remove('valid');
    }
  });
}

async function createRoom() {
  // This endpoint is using the proxy as outlined in netlify.toml
  const newRoomEndpoint = 'https://api.daily.co/v1/rooms';

  // Grab the key from a text input, so we don't store it in this example
  const apiKey = document.getElementById('api-key').value;

  // we'll add 30 min expiry (exp) so rooms won't linger too long on your account
  // we'll also turn on chat (enable_chat)
  // see other available options at https://docs.daily.co/reference#create-room
  const exp = Math.round(Date.now() / 1000) + 60 * 30;
  const options = {
    properties: {
      exp: exp,
      enable_chat: true
    }
  };

  try {
    let response = await fetch(newRoomEndpoint, {
      method: 'POST',
      body: JSON.stringify(options),
      mode: 'cors',
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    room = await response.json();

    document.getElementById('room-url').value = room.url;
  } catch (e) {
    console.error(e);
  }
}

// Creates a temporary Daily demo room
// Assigns the demo room URL to the input value
// Changes the color of the 'join' button once a room has been created
async function createDemoRoom() {
  const createButton = document.getElementById('create-button');
  const joinButton = document.getElementsByClassName('join-call')[0];
  createButton.innerHTML = 'Creating room...';

  await createRoom();

  joinButton.classList.toggle('turn-green');
  createButton.innerHTML = 'Copy room link';
  createButton.setAttribute('onclick', 'copyLink()');

  displayDemoRoomTimer();
}

// Joins Daily call
// Passes the value in the 'room-url' input to callFrame.join
async function joinCall() {
  const url = document.getElementById('room-url').value;

  await callFrame.join({
    url,
    showLeaveButton: true
  });
}

/* Call panel button functions */
function copyLink() {
  const link = document.getElementById('room-url');
  link.select();
  document.execCommand('copy');
  console.log('copied');
}

/* Event listener callbacks */

// Logs the Daily event to the console
function showEvent(e) {
  console.log('callFrame event', e);
}

// Displays the call
// Changes instructional text and button to "copy" instead of "create"
// Hides the join call button
// Calls functions to update network stats and display demo room
function showCallDisplay(e) {
  const callPanel = document.getElementsByClassName('call-panel')[0],
    joinButton = document.getElementsByClassName('join-call')[0],
    instructionText = document.getElementById('instruction-text');

  showEvent(e);
  setInterval(updateNetworkInfoDisplay, 5000);

  callPanel.classList.remove('hide');
  callPanel.classList.add('show');

  instructionText.innerHTML = 'Copy and share the URL to invite others';
  joinButton.classList.remove('button');
  joinButton.classList.add('hide');
}

// 'left-meeting'
// Hides the call once the participant has exited
// Changes text back to "create" instead of copy
// Clears input and button values
// Restores join call and create demo buttons
function hideCallDisplay(e) {
  const expiresCountdown = document.getElementsByClassName(
      'expires-countdown'
    )[0],
    callPanel = document.getElementsByClassName('call-panel')[0],
    instructionText = document.getElementById('instruction-text'),
    topButton = document.getElementById('create-button'),
    joinButton = document.getElementsByClassName('join-call')[0];

  showEvent(e);

  expiresCountdown.classList.toggle('hide');

  callPanel.classList.remove('show');
  callPanel.classList.add('hide');

  instructionText.innerHTML =
    'To get started, enter an existing room URL or create a temporary demo room';
  joinButton.classList.remove('hide');
  joinButton.classList.add('button');
  topButton.innerHTML = 'Create demo room';
  topButton.setAttribute('onclick', 'createDemoRoom()');
}

function toggleCamera() {
  callFrame.setLocalVideo(!callFrame.participants().local.video);
}

function toggleMic() {
  callFrame.setLocalAudio(!callFrame.participants().local.audio);
}

/* Other helper functions */

// Populates 'network info' with information info from daily-js
async function updateNetworkInfoDisplay() {
  let networkInfo = document.getElementsByClassName('network-info')[0],
    statsInfo = await callFrame.getNetworkStats();
  networkInfo.innerHTML = `
      <li>
        Video send:
        ${Math.floor(statsInfo.stats.latest.videoSendBitsPerSecond / 1000)} kb/s
      </li>
      <li>
        Video recv:
        ${Math.floor(statsInfo.stats.latest.videoRecvBitsPerSecond / 1000)} kb/s
      </li>
      <li>
        Worst send packet loss:
        ${Math.floor(statsInfo.stats.worstVideoSendPacketLoss * 100)}%
      </li>
      <li>Worst recv packet loss:
        ${Math.floor(statsInfo.stats.worstVideoRecvPacketLoss * 100)}%
      </li>
  `;
  document.getElementsByClassName('loading-network')[0].classList.add('hide');
}

// Displays a countdown timer for the demo room if a demo room has been created
function displayDemoRoomTimer() {
  if (!window.expiresUpdate) {
    window.expiresUpdate = setInterval(() => {
      let exp = room && room.config && room.config.exp;
      if (exp) {
        document.getElementsByClassName('expires-countdown')[0].innerHTML = `
           <em>⏳ Heads up! Your demo room expires in
             ${Math.floor((new Date(exp * 1000) - Date.now()) / 1000)}
           seconds ⏳</em>
         `;
      }
    }, 1000);
  }
}
