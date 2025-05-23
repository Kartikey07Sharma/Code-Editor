import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid/nanoid.js';

const socket = io();
let editor = null;

// Initialize Monaco Editor
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
require(['vs/editor/editor.main'], () => {
  editor = monaco.editor.create(document.getElementById('editorContainer'), {
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    language: 'javascript'
  });

  editor.onDidChangeModelContent(() => {
    const code = editor.getValue();
    socket.emit('code-change', {
      roomId,
      code,
      lang: languageSelect.value
    });
  });
});

// DOM Elements and Variables
const homePage = document.getElementById("homePage");
const editorPage = document.getElementById("editorPage");
const joinBtn = document.getElementById("joinBtn");
const createBtn = document.getElementById("createNewBtn");
const leaveBtn = document.getElementById("leaveBtn");
const runBtn = document.getElementById("runBtn");
const saveBtn = document.getElementById("saveBtn");
const sendBtn = document.getElementById("sendBtn");
const roomIdInput = document.getElementById("roomIdInput");
const usernameInput = document.getElementById("usernameInput");
const languageSelect = document.getElementById("languageSelect");
const inputArea = document.getElementById("inputArea");
const chatArea = document.getElementById("chatArea");
const chatInput = document.getElementById("chatInput");
const clientsList = document.getElementById("clientsList");

let username = "";
let roomId = "";
const MAX_USERS = 5;

// Room Creation
createBtn.addEventListener("click", () => {
  const newRoomId = nanoid(8);
  roomIdInput.value = newRoomId;
});

// Join Room
joinBtn.addEventListener("click", () => {
  roomId = roomIdInput.value.trim();
  username = usernameInput.value.trim();
  
  if (!roomId || !username) {
    return alert("Room ID & Username required!");
  }

  homePage.style.display = "none";
  editorPage.style.display = "flex";
  socket.emit("join", { roomId, username });
});

// Leave Room
leaveBtn.addEventListener("click", () => {
  socket.emit("leave", { roomId, username });
  window.location.reload();
});

// Run Code - simulate terminal output
runBtn.addEventListener("click", () => {
  const code = editor.getValue();
  const input = inputArea.value;
  const lang = languageSelect.value;

  socket.emit("code-change", { roomId, code, input, lang });

  // Simulate output in terminal
  const terminal = document.getElementById("terminalOutput");
  terminal.textContent = `> Running ${lang}...\n> Output:\n${code.length > 0 ? "Executed successfully." : "No code to run."}`;
});

// Save Code to PC
saveBtn.addEventListener("click", () => {
  const code = editor.getValue();
  const lang = languageSelect.value.toLowerCase();
  const blob = new Blob([code], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `code.${lang === 'c++' ? 'cpp' : lang}`;
  a.click();
});

// Chat Functionality
sendBtn.addEventListener("click", () => {
  const msg = chatInput.value.trim();
  if (msg) {
    socket.emit("chat-message", {
      username,
      message: msg,
      roomId,
    });
    chatInput.value = "";
  }
});

// Socket.io Event Handlers
socket.on("chat-message", ({ username, message }) => {
  const msgDiv = document.createElement("div");
  msgDiv.innerHTML = `<strong>${username}:</strong> ${message}`;
  chatArea.appendChild(msgDiv);
  chatArea.scrollTop = chatArea.scrollHeight;
});

socket.on("joined", ({ clients }) => {
  updateClientList(clients);
  if (clients.length >= MAX_USERS) {
    alert('Room full!');
  }
});

socket.on("disconnected", ({ clients }) => {
  updateClientList(clients);
});

socket.on("sync-code", ({ code }) => {
  if (editor.getValue() !== code) {
    editor.setValue(code);
  }
});

socket.on("code-change", ({ code }) => {
  if (editor.getValue() !== code) {
    editor.setValue(code);
  }
});

// Update Client List
function updateClientList(clients) {
  clientsList.innerHTML = "";
  if (clients.length === 0) return;

  const box = document.createElement("div");
  box.className = "leftBox";

  clients.forEach((client, index) => {
    const userLine = document.createElement("div");
    userLine.textContent = `USER ${index + 1} = ${client}`;
    box.appendChild(userLine);
  });

  clientsList.appendChild(box);
}

// Presence Updates
setInterval(() => {
  if (editor) {
    socket.emit("presence", {
      roomId,
      position: editor.getPosition()
    });
  }
}, 1000);
