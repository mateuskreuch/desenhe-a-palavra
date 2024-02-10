const DICTIONARY_API = 'https://api.dicionario-aberto.net'

//----------------------------------------------------------------------------//

const urlParams = new URLSearchParams(window.location.search);

const NORMAL = 1;
const NO_WORD = 2;
const FAKE_WORD = 3;
const SAME_WORD = 4;

let playerCount = parseInt(urlParams.get('playerCount'));
let noWordCount = parseInt(urlParams.get('noWordCount'));
let fakeWordCount = parseInt(urlParams.get('fakeWordCount'));
let sameWordCount = parseInt(urlParams.get('sameWordCount'));
let sameWordPercentage = parseInt(urlParams.get('sameWordPercentage'));
let currentPlayer = 0;
let classes = [];
let word = '';
let definition = '';
let fakeWord = '';
let fakeDefinition = '';
let currentScreen = 0;

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('playerCount').value = playerCount;
  document.getElementById('noWordCount').value = noWordCount;
  document.getElementById('fakeWordCount').value = fakeWordCount;
  document.getElementById('sameWordCount').value = sameWordCount;
  document.getElementById('sameWordPercentage').value = sameWordPercentage;
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
   noWordCount = parseInt(document.getElementById('noWordCount').value);
   fakeWordCount = parseInt(document.getElementById('fakeWordCount').value);
   sameWordCount = parseInt(document.getElementById('sameWordCount').value);
   sameWordPercentage = parseInt(document.getElementById('sameWordPercentage').value);

   if (isNaN(playerCount)) playerCount = 0;
   if (isNaN(noWordCount)) noWordCount = 0;
   if (isNaN(fakeWordCount)) fakeWordCount = 0;
   if (isNaN(sameWordCount)) sameWordCount = 0;
   if (isNaN(sameWordPercentage)) sameWordPercentage = 50;

   if (playerCount < 0
   ||  noWordCount < 0
   ||  fakeWordCount < 0
   ||  sameWordCount < 0)
   {
      window.alert('Poucos jogadores');
      return false;
   }

   let nonNormalCount = noWordCount + fakeWordCount + sameWordCount;

   classes = Array(playerCount - nonNormalCount).fill(NORMAL);
   classes = classes.concat(Array(noWordCount).fill(NO_WORD));
   classes = classes.concat(Array(fakeWordCount).fill(FAKE_WORD));
   classes = classes.concat(Array(sameWordCount).fill(SAME_WORD));
   classes = classes.sort(() => 0.5 - Math.random());
   
   fetchWords();

   return false;
}

function restart() {
   let url = window.location.href.split('?')[0];

   url = url + '?playerCount=' + playerCount;
   url = url + '&noWordCount=' + noWordCount;
   url = url + '&fakeWordCount=' + fakeWordCount;
   url = url + '&sameWordCount=' + sameWordCount;
   url = url + '&sameWordPercentage=' + sameWordPercentage;
   
   location.replace(url);

   return false;
}

function hideWord() {
   currentPlayer++;

   changeScreen('./hide.html');

   return false;
}

function showWord() {
   if (currentPlayer >= playerCount) {
      changeScreen('./final.html').then(_ => {
         document.getElementById('rightWord').innerHTML = `<i>${word}</i>. ${definition}`;
         document.getElementById('wrongWord').innerHTML = `<i>${fakeWord}</i>. ${fakeDefinition}`;
      });
   }
   else {
      changeScreen('./show.html').then(_ => {
         if (classes[currentPlayer] == NORMAL) {
            document.getElementById('wordLabel').innerHTML = word;
            document.getElementById('definitionLabel').innerHTML = definition;
         }
         else if (classes[currentPlayer] == FAKE_WORD) {
            document.getElementById('wordLabel').innerHTML = fakeWord;
            document.getElementById('definitionLabel').innerHTML = fakeDefinition;
         }
         else if (classes[currentPlayer] == SAME_WORD) {
            let hiddenDefinition = definition.split('');

            for (let i = 0; i < hiddenDefinition.length; i++) {
               if (100*Math.random() < sameWordPercentage) {
                  hiddenDefinition[i] = hiddenDefinition[i].replaceAll(/[A-zÀ-ú]/g, '_');
               }
            }

            hiddenDefinition = hiddenDefinition.join('');

            document.getElementById('definitionLabel').innerHTML = hiddenDefinition;
         }
      });
   }

   return false;
}

async function fetchWord() {
   let wordRes = await fetch(DICTIONARY_API + '/random');
   wordRes = await wordRes.json();
   wordRes = wordRes.word;

   let definitionRes = await fetch(DICTIONARY_API + '/word/' + wordRes);
   definitionRes = await definitionRes.json();
   definitionRes = definitionRes[0].xml;
   definitionRes = definitionRes.replaceAll(/\r?\n/g, ' ');

   let definitions = definitionRes.match(/<def>.*?<\/def>/g);

   console.log(definitionRes);
   console.log(definitions);

   for (let i = 0; i < definitions.length; i++) {
      definitions[i] = definitions[i].slice(5, -6).trim();

      // if there is any XML tag remaining, try again
      if (definitions[i].search(/<.*?>/g) >= 0) {
         return fetchWord();
      }
   }

   definitionRes = definitions.join(' ');
   definitionRes = definitionRes.replaceAll(/_(.*?)_/g, "<i>$1</i>");

   let normalized = definitionRes.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

   if (normalized.search(/planta/g) >= 0 || normalized.search(/arvore/g) >= 0) {
      return fetchWord();
   }

   return [wordRes, definitionRes];
}

async function fetchWords() {
   [word, definition] = await fetchWord();

   do {
      [fakeWord, fakeDefinition] = await fetchWord();
   } while (fakeWord == word);

   showWord();
}