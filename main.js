const DICTIONARY_API = "https://api.dicionario-aberto.net"

//----------------------------------------------------------------------------//

let playerCount = 0;
let imposterCount = 0;
let currentPlayer = 0;
let isImposter = [];
let word = "";
let definition = "";
let currentScreen = 0;
let lastClickTime;

//----------------------------------------------------------------------------//

Array.prototype.random = function () {
  return this[Math.floor(Math.random() * this.length)];
}

//----------------------------------------------------------------------------//

document.onclick = () => {
   let elapsed = new Date().getTime() - lastClickTime;

   if ((elapsed < 400) && (elapsed > 0)) {
      if (currentScreen == "./show.html") {
         hideWord();
      }
      else if (currentScreen) {
         showWord();
      }
   }

   lastClickTime = new Date().getTime();
}

async function changeScreen(url) {
   currentScreen = url;

   let screen = await fetch(url);
   screen = await screen.text();

   document.getElementById("root").innerHTML = screen;
}

function play() {
   playerCount = parseInt(document.getElementById("playerCount").value);
   imposterCount = parseInt(document.getElementById("imposterCount").value);

   if (playerCount < 3 || imposterCount < 1) {
      window.alert("Poucos jogadores");
      return false;
   }

   if (playerCount <= imposterCount) {
      window.alert("Impostores demais");
      return false;
   }

   isImposter = Array.from({length: playerCount}, (v, k) => k < imposterCount);
   isImposter = isImposter.sort(() => 0.5 - Math.random());
   
   fetchWord();

   return false;
}

function hideWord() {
   currentPlayer++;

   if (currentPlayer >= playerCount) {
      location.reload();
   }
   else {
      changeScreen("./hide.html");
   }

   return false;
}

function showWord() {
   changeScreen("./show.html").then(_ => {
      if (!isImposter[currentPlayer]) {
         document.getElementById("wordLabel").innerHTML = word;
         document.getElementById("definitionLabel").innerHTML = definition;
      }
   });

   return false;
}

async function fetchWord() {
   let wordResponse = await fetch(DICTIONARY_API + "/random");
   wordResponse = await wordResponse.json();

   word = wordResponse.word.slice(0, -1);

   let definitionResponse = await fetch(DICTIONARY_API + "/prefix/" + word);
   definitionResponse = await definitionResponse.json();
   definitionResponse = definitionResponse.random();
   
   word = definitionResponse.word;
   definition = definitionResponse.preview;
   
   definition = definition.replace("<span>", "");
   definition = definition.replace("<span/>", "");
   definition = definition.replace(/\./g, ". ");

   showWord();
}