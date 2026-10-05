function createEl(tag,className = '',text = ''){
    const el = document.createElement(tag);  
    if (className){
        el.className = className;
    }

    if (text){
        el.textContent = text;
    }          
    return el;
}

const app = createEl('div', 'app');
const header = createEl('header', 'app-header');
const stats = createEl('div', 'stats');
const movesEl = createEl('span', '', 'Ходы: 0');
const pairsEl = createEl('span', '', 'Пары: 0 из 8');
const board = createEl('div', 'board');
const newGameBtn = createEl('button', '', 'Новая игра');
const leaderboardBtn = createEl('button', '', 'Таблица лидеров');
const STORAGE_KEY = 'memory-results';

header.append(newGameBtn);
header.append(leaderboardBtn);
stats.append(movesEl);
stats.append(pairsEl);

app.append(header);
app.append(stats);
app.append(board);
document.body.append(app);

const symbols = ['🍎','🍌','🍇','🍒','🍉','🍍','🥥','🥝'];
const cards = Array.from({ length: 16 }, (_, index) => ({
  id: index + 1,
  symbol: symbols[index % symbols.length],
  isOpen: false
}));

function shuffle(arr){
    for(let i= arr.length-1; i > 0; i--){
        const n = Math.floor(Math.random() * (i+1));
        const temp = arr[i];
        arr[i] = arr[n];
        arr[n] = temp;
    }
    return arr;
}

let firstCard = null;
let firstEl = null;
let isLocked = false;
let moves = 0; 
let pairs = 0;
let timerId = null;

function renderBoard(){
    board.replaceChildren();
    for(let i=0; i< cards.length; i++){
        const card = cards[i];
        const el = createEl('div', 'card');
        el.dataset.id = card.id;
        el.addEventListener('click', function () {
            if(isLocked){
                return;
            }
            if (card.isOpen){
                return;
            }
            card.isOpen = true;
            el.textContent = card.symbol;
            el.classList.add('open');

            if (firstCard === null){
                firstCard = card;
                firstEl = el;
                return;
            }

            moves++;
            movesEl.textContent = 'Ходы: ' + moves;

            if(firstCard.symbol === card.symbol){
                pairs++;
                pairsEl.textContent = 'Пары: ' + pairs + ' из 8';
                if(pairs ===8){
                    saveResult(moves);
                    showWinModal();
                }

            } else {
                const a = firstCard;
                const aEl = firstEl;
                isLocked = true;
                timerId = setTimeout(() => {
                    a.isOpen = false;
                    aEl.className = 'card';
                    aEl.textContent = ''; 
                    card.isOpen = false;
                    el.className = 'card';
                    el.textContent = '';
                    isLocked = false; 
                }, 1000);

            }
            firstCard = null;
            firstEl = null;
        });
        board.append(el);
    }

    firstCard = null;
    firstEl = null;
}

function startNewGame(){
    clearTimeout(timerId);
    timerId = null;
    
    firstCard = firstEl = null;
    isLocked = false;
    moves = pairs = 0;

    for(let i = 0; i< cards.length; i++){
        cards[i].isOpen = false;
    }

    movesEl.textContent = 'Ходы: 0';
    pairsEl.textContent = 'Пары: 0 из 8';

    shuffle(cards);
    renderBoard();
}

newGameBtn.addEventListener('click', function () {
    startNewGame();
});

let overlay = null;

function onKeydown(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
}

function openModal(content) {
    if(overlay !== null){
        return;
    }
    const modal = createEl('div', 'modal', '');
    overlay = createEl('div', 'modal-overlay', '');

    modal.append(content);
    overlay.append(modal);
  
    overlay.addEventListener('click', function (event) {

        if (event.target === overlay){
            closeModal();
        } 
    });

    document.body.append(overlay);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeydown);
}

function closeModal(){
    if (overlay === null) { 
        return; 
    }

    overlay.remove();
    overlay = null;
    document.body.style.overflow = '';  
    document.removeEventListener('keydown', onKeydown);
}

leaderboardBtn.addEventListener('click', function () {
    showLeaderboard();
});

function showWinModal(){
    const content = createEl('div', 'content', '');
    const closeBtn = createEl('button', '', 'Закрыть');
    const winNewGameBtn = createEl('button', '', 'Новая игра');
    closeBtn.addEventListener('click', function () {
        closeModal();
    });
    winNewGameBtn.addEventListener('click', function () {
        closeModal();
        startNewGame();
    });

    content.append(createEl('h1', '', 'Победа!'));
    content.append(createEl('span', '', 'Ходов: ' + moves));
    content.append(winNewGameBtn);
    content.append(closeBtn);
    openModal(content);
}


function loadResults() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw === null){
        return [];
    }else{
        try {
            return JSON.parse(raw)
        } catch (e) {
            return [];
        }
    }
}

function saveResult(movesCount) {
    let results = loadResults();
    results.push({ moves: movesCount, date: Date.now() });
    results.sort(function (a, b) {
    if(a.moves !== b.moves){
        return a.moves - b.moves;
    }else{
        return a.date - b.date;
    }
    });

    results = results.slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

function formatDate(timestamp) {
    const d = new Date(timestamp);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return day + '.' + month + '.' + year;
}

function showLeaderboard() {
    const results = loadResults();
    const content = createEl('div', 'content');
    content.append(createEl('h2', '', 'Таблица лидеров'));

    if (results.length === 0) {
        content.append(createEl('p', '', 'Пока нет результатов'));
    } else {
        const table = createEl('table', 'leaderboard');

        const headRow = createEl('tr');
        headRow.append(createEl('th', '', 'Место'));
        headRow.append(createEl('th', '', 'Ходы'));
        headRow.append(createEl('th', '', 'Дата'));
        table.append(headRow);

        for (let i = 0; i < results.length; i++) {
            const row = createEl('tr');
            row.append(createEl('td', '', String(i + 1)));
            row.append(createEl('td', '', String(results[i].moves)));
            row.append(createEl('td', '', formatDate(results[i].date)));
            table.append(row);
        }

        content.append(table);
    }

    const closeBtn = createEl('button', '', 'Закрыть');
    closeBtn.addEventListener('click', function () {
        closeModal();
    });
    content.append(closeBtn);

    openModal(content);
}

startNewGame();