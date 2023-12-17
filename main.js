const DICTIONARY_API = 'https://api.dicionario-aberto.net'

//----------------------------------------------------------------------------//

const urlParams = new URLSearchParams(window.location.search);

const NORMAL = 1;
const IMPOSTER = 2;
const FAKE = 3;

let playerCount = parseInt(urlParams.get('playerCount'));
let imposterCount = parseInt(urlParams.get('imposterCount'));
let fakeCount = parseInt(urlParams.get('fakeCount'));
let currentPlayer = 0;
let classes = [];
let word = '';
let definition = '';
let fakeWord = '';
let fakeDefinition = '';
let currentScreen = 0;

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('playerCount').value = playerCount;
  document.getElementById('imposterCount').value = imposterCount;
  document.getElementById('fakeCount').value = fakeCount;
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
   fakeCount = parseInt(document.getElementById('fakeCount').value);

   if (isNaN(playerCount)) playerCount = 0;
   if (isNaN(imposterCount)) imposterCount = 0;
   if (isNaN(fakeCount)) fakeCount = 0;

   if (playerCount < 0 || imposterCount < 0 || fakeCount < 0) {
      window.alert('Poucos jogadores');
      return false;
   }

   classes = Array(playerCount - (imposterCount + fakeCount)).fill(NORMAL);
   classes = classes.concat(Array(imposterCount).fill(IMPOSTER));
   classes = classes.concat(Array(fakeCount).fill(FAKE));
   classes = classes.sort(() => 0.5 - Math.random());
   
   fetchWords();

   return false;
}

function hideWord() {
   currentPlayer++;

   if (currentPlayer >= playerCount) {
      let url = window.location.href.split('?')[0];

      url = url + '?playerCount=' + playerCount;
      url = url + '&imposterCount=' + imposterCount;
      url = url + '&fakeCount=' + fakeCount;
      
      location.replace(url);
   }
   else {
      changeScreen('./hide.html');
   }

   return false;
}

function showWord() {
   changeScreen('./show.html').then(_ => {
      if (classes[currentPlayer] == NORMAL) {
         document.getElementById('wordLabel').innerHTML = word;
         document.getElementById('definitionLabel').innerHTML = definition;
      }
      else if (classes[currentPlayer] == FAKE) {
         document.getElementById('wordLabel').innerHTML = fakeWord;
         document.getElementById('definitionLabel').innerHTML = fakeDefinition;
      }
   });

   return false;
}

async function fetchWord() {
   let wordRes = await fetch(DICTIONARY_API + '/random');
   wordRes = await wordRes.json();
   wordRes = wordRes.word;

   let definitionRes = await fetch(DICTIONARY_API + '/word/' + wordRes);
   definitionRes = await definitionRes.json();
   definitionRes = definitionRes[0].xml;
   definitionRes = definitionRes.replaceAll('\n', ' ');

   let definitions = definitionRes.match(/<def>.*?<\/def>/g);

   for (let i = 0; i < definitions.length; i++) {
      definitions[i] = definitions[i].slice(5, -6).trim();

      // if there is any XML tag remaining, try again
      if (definitions[i].search(/<.*?>/g) >= 0) {
         return fetchWord();
      }
   }

   definitionRes = definitions.join(' ');
   definitionRes = definitionRes.replaceAll(/_(.*?)_/g, "<i>$1</i>");

   return [wordRes, definitionRes];
}

async function fetchWords() {
   [word, definition] = await fetchWord();

   do {
      [fakeWord, fakeDefinition] = await fetchWord();
   } while (fakeWord == word);

   showWord();
}