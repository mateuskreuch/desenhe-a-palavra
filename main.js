const DICTIONARY_API = 'https://api.dicionario-aberto.net'

//----------------------------------------------------------------------------//

const urlParams = new URLSearchParams(window.location.search);

let playerCount = parseInt(urlParams.get('playerCount'));
let imposterCount = parseInt(urlParams.get('imposterCount'));
let currentPlayer = 0;
let isImposter = [];
let word = '';
let definition = '';
let impostorWord = '';
let impostorDefinition = '';
let currentScreen = 0;

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('playerCount').value = playerCount;
  document.getElementById('imposterCount').value = imposterCount;
});

//----------------------------------------------------------------------------//

async function changeScreen(url) {
   currentScreen = url;

   let screen = await fetch(url);
   screen = await screen.text();

   document.getElementById('root').innerHTML = screen;
}

function play() {
   playerCount = parseInt(document.getElementById('playerCount').value);
   imposterCount = parseInt(document.getElementById('imposterCount').value);

   if (isNaN(playerCount) || isNaN(imposterCount)) {
      return false;
   }

   if (playerCount < 3 || imposterCount < 1) {
      window.alert('Poucos jogadores');
      return false;
   }

   if (playerCount <= imposterCount) {
      window.alert('Impostores demais');
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

      url = url + '?playerCount=' + playerCount;
      url = url + '&imposterCount=' + imposterCount;
      
      location.replace(url);
   }
   else {
      changeScreen('./hide.html');
   }

   return false;
}

function showWord() {
   changeScreen('./show.html').then(_ => {
      if (!isImposter[currentPlayer]) {
         document.getElementById('wordLabel').innerHTML = word;
         document.getElementById('definitionLabel').innerHTML = definition;
      }
      else {
         document.getElementById('wordLabel').innerHTML = impostorWord;
         document.getElementById('definitionLabel').innerHTML = impostorDefinition;
      }
   });

   return false;
}

async function fetchWord() {
   word = await fetch(DICTIONARY_API + '/random');
   word = await word.json();
   word = word.word;

   definition = await fetch(DICTIONARY_API + '/word/' + word);
   definition = await definition.json();
   definition = definition[0].xml;
   definition = definition.replaceAll('\n', ' ');

   let definitions = definition.match(/<def>.*?<\/def>/g);

   for (let i = 0; i < definitions.length; i++) {
      definitions[i] = definitions[i].slice(5, -6).trim();

      // if there is any XML tag remaining, try again
      if (definitions[i].search(/<.*?>/g) >= 0) {
         fetchWord();
         return;
      }
   }

   definition = definitions.join(' ');
   definition = definition.replaceAll(/_(.*?)_/g, "<i>$1</i>");

   impostorWord = await fetch(DICTIONARY_API + '/random');
   impostorWord = await impostorWord.json();
   impostorWord = impostorWord.word;

   impostorDefinition = await fetch(DICTIONARY_API + '/word/' + impostorWord);
   impostorDefinition = await impostorDefinition.json();
   impostorDefinition = impostorDefinition[0].xml;
   impostorDefinition = impostorDefinition.replaceAll('\n', ' ');

   definitions = impostorDefinition.match(/<def>.*?<\/def>/g);

   for (let i = 0; i < definitions.length; i++) {
      definitions[i] = definitions[i].slice(5, -6).trim();

      // if there is any XML tag remaining, try again
      if (definitions[i].search(/<.*?>/g) >= 0) {
         fetchWord();
         return;
      }
   }

   impostorDefinition = definitions.join(' ');
   impostorDefinition = impostorDefinition.replaceAll(/_(.*?)_/g, "<i>$1</i>");

   showWord();
}