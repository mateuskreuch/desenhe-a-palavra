const DICTIONARY_API = 'https://api.dicionario-aberto.net'

//----------------------------------------------------------------------------//

const urlParams = new URLSearchParams(window.location.search);

const IMAGE_COUNT = 280;
const HINT_COUNT = 210;

const NORMAL = 1;
const NO_WORD = 2;
const FAKE_WORD = 3;
const SAME_WORD = 4;
const JOKER = 5;

let playerCount = parseInt(urlParams.get('playerCount'));
let noWordCount = parseInt(urlParams.get('noWordCount'));
let fakeWordCount = parseInt(urlParams.get('fakeWordCount'));
let sameWordCount = parseInt(urlParams.get('sameWordCount'));
let sameWordPercentage = parseInt(urlParams.get('sameWordPercentage'));
let jokerCount = parseInt(urlParams.get('jokerCount'));
let hintAmount = parseInt(urlParams.get('hintAmount'));
let playStyle = urlParams.get('playStyle') ?? 'word';
let currentPlayer = 0;
let currentScreen = 0;
let classes = [];

let word = '';
let definition = '';
let fakeWord = '';
let fakeDefinition = '';

let hintId = 0;
let fakeHintId = 0;
let hints = [];

let imageId = 0;
let fakeImageId = 0;

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('playerCount').value = playerCount;
  document.getElementById('noWordCount').value = noWordCount;
  document.getElementById('fakeWordCount').value = fakeWordCount;
  document.getElementById('sameWordCount').value = sameWordCount;
  document.getElementById('sameWordPercentage').value = sameWordPercentage;
  document.getElementById('jokerCount').value = jokerCount;
  document.getElementById('hintAmount').value = hintAmount;
  document.getElementById('playStyle').value = playStyle;
});

//----------------------------------------------------------------------------//

async function changeScreen(url) {
   currentScreen = url;

   let screen = await fetch(url);
   screen = await screen.text();

   document.getElementById('root').innerHTML = screen;
}

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min))
}

function play() {
   playerCount = parseInt(document.getElementById('playerCount').value);
   noWordCount = parseInt(document.getElementById('noWordCount').value);
   fakeWordCount = parseInt(document.getElementById('fakeWordCount').value);
   sameWordCount = parseInt(document.getElementById('sameWordCount').value);
   sameWordPercentage = parseInt(document.getElementById('sameWordPercentage').value);
   jokerCount = parseInt(document.getElementById('jokerCount').value);
   hintAmount = parseInt(document.getElementById('hintAmount').value);
   playStyle = document.getElementById('playStyle').value;
   hintId = randInt(140, HINT_COUNT);
   fakeHintId = randInt(140, HINT_COUNT);
   imageId = randInt(0, IMAGE_COUNT);
   fakeImageId = randInt(0, IMAGE_COUNT);

   while (fakeHintId == hintId) { fakeHintId = randInt(0, HINT_COUNT); }
   while (fakeImageId == imageId) { fakeImageId = randInt(0, IMAGE_COUNT); }

   if (isNaN(playerCount)) playerCount = 0;
   if (isNaN(noWordCount)) noWordCount = 0;
   if (isNaN(fakeWordCount)) fakeWordCount = 0;
   if (isNaN(sameWordCount)) sameWordCount = 0;
   if (isNaN(sameWordPercentage)) sameWordPercentage = 50;
   if (isNaN(jokerCount)) jokerCount = 0;
   if (isNaN(hintAmount)) hintAmount = 4;

   if (playerCount < 0
   ||  noWordCount < 0
   ||  fakeWordCount < 0
   ||  sameWordCount < 0
   ||  jokerCount < 0)
   {
      window.alert('Poucos jogadores');
      return false;
   }

   let nonNormalCount = noWordCount + fakeWordCount + sameWordCount + jokerCount;

   classes = Array(playerCount - nonNormalCount).fill(NORMAL);
   classes = classes.concat(Array(noWordCount).fill(NO_WORD));
   classes = classes.concat(Array(fakeWordCount).fill(FAKE_WORD));
   classes = classes.concat(Array(sameWordCount).fill(SAME_WORD));
   classes = classes.concat(Array(jokerCount).fill(JOKER));
   classes = classes.sort(() => 0.5 - Math.random());

   if (playStyle === 'image') {
      show();
   }
   else if (playStyle === 'hints') {
      fetchHints();
   }
   else {
      fetchWords();
   }

   return false;
}

function restart() {
   let url = window.location.href.split('?')[0];

   url = url + '?playerCount=' + playerCount;
   url = url + '&noWordCount=' + noWordCount;
   url = url + '&fakeWordCount=' + fakeWordCount;
   url = url + '&sameWordCount=' + sameWordCount;
   url = url + '&sameWordPercentage=' + sameWordPercentage;
   url = url + '&jokerCount=' + jokerCount;
   url = url + '&hintAmount=' + hintAmount;
   url = url + '&playStyle=' + playStyle;

   location.replace(url);

   return false;
}

function hide() {
   currentPlayer++;

   changeScreen('./hide.html');

   return false;
}

function show() {
   if (playStyle === 'image') {
      return showImage();
   }
   else if (playStyle === 'hints') {
      return showHints();
   }
   else {
      return showWord();
   }
}

function showImage() {
   if (currentPlayer >= playerCount) {
      changeScreen('./final.html').then(_ => {
         document.getElementById('rightImage').src = `images/card-${imageId}.jpg`;
         document.getElementById('wrongImage').src = `images/card-${fakeImageId}.jpg`;
      });
   }
   else {
      changeScreen('./show.html').then(_ => {
         document.getElementById('wordLabel').innerHTML =
            'Grave a imagem' + (classes[currentPlayer] == JOKER ? ' 🤡' : '');
         document.getElementById('definitionLabel').innerHTML = '';

         if (classes[currentPlayer] == NORMAL || classes[currentPlayer] == JOKER) {
            document.getElementById('definitionImage').src = `images/card-${imageId}.jpg`;
         }
         else if (classes[currentPlayer] == FAKE_WORD) {
            document.getElementById('definitionImage').src = `images/card-${fakeImageId}.jpg`;
         }
         else if (classes[currentPlayer] == SAME_WORD) {
            document.getElementById('definitionImage').src = `images/card-${imageId}.jpg`;
            document.getElementById('definitionImage').style['filter'] = `blur(${0.3*sameWordPercentage}px)`;
         }
      });
   }

   return false;
}

function showHints() {
   if (currentPlayer >= playerCount) {
      changeScreen('./final.html').then(_ => {
         document.getElementById('rightWord').innerHTML = `<i>${word}</i>. ${definition}`;
      });
   }
   else {
      changeScreen('./show.html').then(_ => {
         if (classes[currentPlayer] == NORMAL || classes[currentPlayer] == JOKER) {
            document.getElementById('wordLabel').innerHTML = 'Adivinhe pelas dicas' + (classes[currentPlayer] == JOKER ? ' 🤡' : '');

            let hintIds = Array.from({ length: hints.length }, (_, i) => i);

            hintIds = hintIds.sort(() => 0.5 - Math.random());

            let hint = '';

            for (let i = 0; i < hintAmount; i++) {
               hint += `<li>${hints[hintIds[i]]}</li>`;
            }

            document.getElementById('definitionLabel').innerHTML = hint;
         }
         else {
            document.getElementById('definitionLabel').innerHTML = hints[randInt(0, hints.length)];
         }
      });
   }

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
         if (classes[currentPlayer] == NORMAL || classes[currentPlayer] == JOKER) {
            document.getElementById('wordLabel').innerHTML =
               word + (classes[currentPlayer] == JOKER ? ' 🤡' : '');
            document.getElementById('definitionLabel').innerHTML = definition;
         }
         else if (classes[currentPlayer] == FAKE_WORD) {
            document.getElementById('wordLabel').innerHTML = fakeWord;
            document.getElementById('definitionLabel').innerHTML = fakeDefinition;
         }
         else if (classes[currentPlayer] == SAME_WORD) {
            let words = definition.split(' ');

            for (let i = 0; i < words.length; i++) {
               let letters = words[i].split('');
               let f = 1.0 - sameWordPercentage/100.0;

               let m1 = Math.max(                 1, Math.floor(letters.length*(f - 0.5*f)));
               let m2 = Math.min(letters.length - 1, Math.floor(letters.length*(f + 0.5*f)));

               for (let j = m1; j < m2; j++) {
                  letters[j] = letters[j].replaceAll(/[A-zÀ-ú]/g, '_');
               }

               words[i] = letters.join('');
            }

            words = words.join(' ');

            document.getElementById('definitionLabel').innerHTML = words;
         }
      });
   }

   return false;
}

async function fetchHints() {
   let perfil = await fetch(`perfil/perfil-${hintId}.json`);
   let perfilRes = await perfil.json();

   word = perfilRes[0];
   hints = perfilRes.slice(1);
   hints = hints.sort(() => 0.5 - Math.random());

   console.log(hints);

   show();
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

   show();
}