const DICTIONARY_API = "https://api.dicionario-aberto.net"

//----------------------------------------------------------------------------//

const urlParams = new URLSearchParams(window.location.search);

let playerCount = parseInt(urlParams.get("playerCount"));
let imposterCount = parseInt(urlParams.get("imposterCount"));
let currentPlayer = 0;
let isImposter = [];
let word = "";
let definition = "";
let currentScreen = 0;

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("playerCount").value = playerCount;
  document.getElementById("imposterCount").value = imposterCount;
});

//----------------------------------------------------------------------------//

Array.prototype.random = function () {
  return this[Math.floor(Math.random() * this.length)];
}

//----------------------------------------------------------------------------//

async function changeScreen(url) {
   currentScreen = url;

   let screen = await fetch(url);
   screen = await screen.text();

   document.getElementById("root").innerHTML = screen;
}

function play() {
   playerCount = parseInt(document.getElementById("playerCount").value);
   imposterCount = parseInt(document.getElementById("imposterCount").value);

   if (isNaN(playerCount) || isNaN(imposterCount)) {
      return false;
   }

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
      let url = window.location.href.split('?')[0];

      url = url + "?playerCount=" + playerCount;
      url = url + "&imposterCount=" + imposterCount;
      
      location.replace(url);
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