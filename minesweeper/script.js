const minesweeper = {
    //Possible types of games
    gameType: {
        small: { size: 9, mines: 10 },
        medium: { size: 16, mines: 40 },
        large: { size: 24, mines: 150 }
    },
    //Values correspond to names in stylesheet
    symbols: {0: "", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", flag: "flag", mine: "bomb"},
    logic: 0,
    gameEnd: false, //Prevents play when game is won or lost

    //Gets called when the page is loaded
    init(){
        this.logic = localLogic;

        this.makePage();
        this.startGame(this.gameType.small); //Starts a small game by default
    },

    //Layout creation start
    //Creates the layout of the page
    makePage(){
        const docBod = document.body;
        const docCont = document.createElement("div");
        docCont.classList.add("content");

        const head = this.makeHeader();
        const playfieldDiv = this.makePlayfield();
        const buttonsDiv = this.makeButtons();
        const foot = this.makeFooter();
        
        docBod.appendChild(docCont);

        docCont.appendChild(head);
        docCont.appendChild(playfieldDiv);
        docCont.appendChild(buttonsDiv);
        docCont.appendChild(foot);
    },
    //Creates the header and fills it with information
    makeHeader(){
        const docHead = document.createElement("header");
        docHead.setAttribute("id", "header");
        
        const headerText = document.createElement("p");
        headerText.classList.add("headerText");
        headerText.innerText = "Minesweeper";

        const headerTextLower = document.createElement("p");
        headerTextLower.classList.add("headerTextLower");
        headerTextLower.innerText = "by Jason Patrick Duffy";

        docHead.appendChild(headerText);
        docHead.appendChild(headerTextLower);

        return docHead;
    },
    //Creates the footer and fills it with information
    makeFooter(){
        const docFoot = document.createElement("footer");
        docFoot.setAttribute("id", "footer");

        const copyText = document.createElement("p");
        copyText.innerHTML = "&copy; 2023 by Jason Patrick Duffy";

        docFoot.appendChild(copyText);

        return docFoot;
    },
    //Creates an empty playfield
    makePlayfield(){
        const playDiv = document.createElement("div");
        playDiv.setAttribute("id", "playfield");

        return playDiv;
    },
    //Creates a single button with id idName and text btnText and returns it
    makeGameButton(idName, btnText){
        const btn = document.createElement("button");
        btn.setAttribute("id", idName);
        btn.innerText = btnText;
        return btn;
    },

    //Creates 3 buttons to start the 3 different game types
    makeButtons(){
        const buttonsDiv = document.createElement("div");
        buttonsDiv.setAttribute("id", "buttons");

        const btnSmall = this.makeGameButton("gameSmall", "Small");
        const btnMedium = this.makeGameButton("gameMedium", "Medium");
        const btnLarge = this.makeGameButton("gameLarge", "Large");

        buttonsDiv.appendChild(btnSmall);
        buttonsDiv.appendChild(btnMedium);
        buttonsDiv.appendChild(btnLarge);

        btnSmall.addEventListener("click", event =>{
            this.startGame(this.gameType.small);
        });
        btnMedium.addEventListener("click", event =>{
            this.startGame(this.gameType.medium);
        });
        btnLarge.addEventListener("click", event =>{
            this.startGame(this.gameType.large);
        });

        return buttonsDiv;
    },
    //Layout creation end

    //Fills the playfield with cells corresponding to the given size
    fillPlayfield(size){
        const playfield = document.getElementById("playfield");
        playfield.innerHTML = ""; //Clears everything in playfield

        for (let row = 0; row < size; row++) {
            for (let column = 0; column < size; column++) {
                playfield.appendChild(this.makeCell(row, column, size));
            }
        }
    },

    //Creates a single cell at x=column and y=row for the given size and adds listeners
    makeCell(row, column, size){
        const cell = document.createElement("div");

        cell.dataset.y = row;
        cell.dataset.x = column;

        cell.classList.add("cell");
        cell.classList.add("covered");

        //Fix shadow size
        const root = document.querySelector(':root');
        const vh = 6 / size;
        const vw = 12 / size;
        root.style.setProperty('--shadowsize', `min(${vh}vh, ${vw}vw)`);

        //Fix size of cell
        const style = `calc(100%/${size} - 2*var(--shadowsize) - var(--cellpadding))`;
        cell.style.width = style;
        cell.style.height = style;

        cell.addEventListener("click", (event) =>{
            this.cellClicked(event);
        });
        cell.addEventListener("contextmenu", (event) =>{
            this.cellRightClicked(event);
        });

        cell.addEventListener("touchstart", (event) =>{
            this.touchstart(event);
        });
        cell.addEventListener("touchend", (event) =>{
            this.touchend(event);
        });

        return cell;
    },

    //Cell clicked event, checks and applies game rules
    async cellClicked(event){
        event.preventDefault();
        if(!this.gameEnd){
            const x = event.target.dataset.x;
            const y = event.target.dataset.y;
    
            const res = await this.logic.sweep(x, y);
            
            //Game is lost
            if(res.minehit){
                this.gameEnd = true;
                res.mines.forEach(element => {
                    this.placeSymbol(element.x, element.y, this.symbols.mine);
                    event.target.classList.add("bombHit");
                });
                this.displayOverlay("You lose!");
            }
            else{
                this.placeSymbol(x, y, this.symbols[res.minesAround]);
                res.emptyCells.forEach(element => {
                    this.placeSymbol(element.x, element.y, this.symbols[element.minesAround]);
                });
            }
    
            //Game is won
            if(res.userwins){
                this.gameEnd = true;
                this.displayOverlay("You win!");
            }
        }
    },

    //Cell right click event, places flags
    cellRightClicked(event){
        if(!this.gameEnd){
            event.preventDefault();

            const x = event.target.dataset.x;
            const y = event.target.dataset.y;
    
            this.placeFlag(x, y);
        }
    },

    //Touch stuff for mobile
    startMS: 0, //Object wide var to store the start time of the touch
    touchstart(event){
        event.preventDefault();

        this.startMS = new Date().getTime();
    },
    touchend(event){
        event.preventDefault();

        const endMS = new Date().getTime() - this.startMS;

        if (endMS < 500) { //Treated as left click if touch is less than 500ms long
            this.cellClicked(event);
        }
        else{
            this.cellRightClicked(event);
        }
    },

    //Places a single symbol on x and y
    placeSymbol(x, y, sym){
        const cell = this.getCell(x, y);
        cell.classList.remove("covered");
        cell.classList.remove("flag"); //Removes the flag if there is one
        cell.classList.remove("symbol"); //Removes the symbol tag if there was a flag
        if(sym != ""){ //Only adds a symbol if a symbol should be displayed
            cell.classList.add("symbol");
            cell.classList.add(sym);
        }
    },

    //Toggles a single flag on x and y
    placeFlag(x, y){
        const cell = this.getCell(x, y);
        if(cell.classList.contains("covered")){
            const cell = this.getCell(x, y);
            cell.classList.toggle("symbol");
            cell.classList.toggle("flag");
        }
    },

    //Returns the cell corresponding to x and y
    getCell(x, y){
        return document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    },

    //Displays an overlay with the given text
    displayOverlay(text){
        const overlay = document.createElement("div");
        overlay.classList.add("overlay");

        const textHolder = document.createElement("div");
        overlay.appendChild(textHolder);
        textHolder.innerText = text;

        const playfield = document.getElementById("playfield");
        playfield.appendChild(overlay);
    },

    //Starts the game
    async startGame(gameType){
        this.gameEnd = false;
        await this.logic.init(gameType.size, gameType.mines);
        this.fillPlayfield(gameType.size);
    }
};

//Local game logic
const localLogic = {
    //Runs at start of game logic
    async init(size, mines){
        //Object wide variables
        this.size = size;
        this.mines = mines;
        this.minesPos = [];
        this.field = this.generateField(size);
        this.movecounter = 0;
        this.uncoveredCells = this.generateField(size);
        this.userwins = false;
    },

    //Returns the positions of the mines in an array
    collectMines(){ //Search through mines field and return positions of mines
        let minesList = [];

        for (let row = 0; row < this.size; row++) {
            for (let column = 0; column < this.size; column++) {
                if(this.field[row][column]){
                    minesList.push({x: column, y: row});
                }
            }
        }

        return minesList;
    },

    //Generates a 2 dimensional array corresponding to the given size
    generateField(size){
        let field = [];
        for (let row = 0; row < size; row++) {
            let rowArr = [];

            for (let column = 0; column < size; column++) {
                rowArr[column] = false;
            }

            field[row] = rowArr;
        }
        return field;
    },

    //Places mines on first move, returns if a mine was hit, where the mines are, how many mines there are in the immediate vicinity and the positions of the empty cells in the vicinity with their amount of mines nearby
    async sweep(x, y){
        this.movecounter++;
        
        if(this.movecounter == 1){
            this.placeMines(x, y);
        }

        const hit = this.field[y][x];
        const minesAr = this.countMines(x, y);
        const minesPos = this.collectMines();
        const emptCells = this.getEmptyCells(x,y);

        //Saves uncovered cells in uncoveredCells to be able to tell if the user has won
        this.uncoveredCells[y][x] = true;
        if(!hit && minesAr == 0){
            emptCells.forEach(element => {
                this.uncoveredCells[element.y][element.x] = true;
            });
        }
        
        return minesAr > 0 ? {minehit: hit, mines: minesPos, minesAround: minesAr, emptyCells: [], userwins: this.hasWon()} : {minehit: hit, mines: minesPos, minesAround: minesAr, emptyCells: emptCells, userwins: this.hasWon()};
    },

    //Returns the amount of mines on the fields in the immediate vicinity of x and y
    countMines(x, y){
        let minesAr = 0;

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                let curX = Number(x) + dx;
                let curY = Number(y) + dy;
                if(curX < 0 || curX >= this.size || curY < 0 || curY >= this.size || curX == x && curY == y){ //If curY or curX is out of bounds or if it is the given x and y
                    continue;
                }
                if(this.field[curY][curX]){
                    minesAr++;
                }
            }
        }
        
        return minesAr;
    },

    //Calls playSingleMine as often as the game type requires
    placeMines(x, y){
        for (let i = 0; i < this.mines; i++) {
            this.placeSingleMine(x, y);
        }
    },

    //Places a single mine on a random field that is not (x,y)
    placeSingleMine(x, y){
        while(true){
            const tryX = Math.floor(Math.random() * this.size);
            const tryY = Math.floor(Math.random() * this.size);

            if(!this.field[tryY][tryX] && tryX != x && tryY != y){ //If there is no mine at the randomly generated indexes and the generated indexes are not where the player clicked
                this.field[tryY][tryX] = true; //Places mine
                break;
            }
        }
    },

    //Returns all the cells that are not mines that are connected to (x,y)
    getEmptyCells(x, y){
        let toDo = [{x: x, y: y, minesAround: 0}];
        let done = [];

        while(toDo.length != 0){
            let current = toDo.shift();
            done.push(current);

            const neighbors = this.getNeighbors(current.x, current.y);

            for (const i in neighbors) {
                if(this.inList(neighbors[i], done)){
                    continue;
                }
                if(neighbors[i].minesAround != 0){
                    done.push(neighbors[i]);
                }
                else{
                    if(!this.inList(neighbors[i], toDo)){
                        toDo.push(neighbors[i]);
                    }
                }
            }
        }

        return done;
    },

    //Returns all fields that are not mines in the immediate vicinity of (x,y) and the amount of mines nearby of them
     getNeighbors(x, y){
        let neighbors = [];

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                let curX = Number(x) + dx;
                let curY = Number(y) + dy;
                if(curX < 0 || curX >= this.size || curY < 0 || curY >= this.size || curX == x && curY == y || this.field[curY][curX]){ //If curY or curX is out of bounds, if it is the given x and y or if it is a mine
                    continue;
                }
                neighbors.push({x: curX, y: curY, minesAround: this.countMines(curX,curY)});
            }
        }
        return neighbors;
     },

     //Returns true if the given element is part of the given list
     inList(element, list){
        return list.some(item => element.x == item.x && element.y == item.y);
     },

     //Returns the amount of cells that have been uncovered
     countUncoveredCells(){
        let counter = 0;
        for (let row = 0; row < this.size; row++) {
            for (let column = 0; column < this.size; column++) {
                if(this.uncoveredCells[row][column]){
                    counter++;
                }
            }
        }
        return counter;
     },

     //Returns true if the amount of uncovered cells equals the amount of cells that don't contain mines
     hasWon(){
        return this.countUncoveredCells() == (this.size * this.size - this.mines);
     }
}

//Remote game logic
const remoteLogic = {
    server: "https://www2.hs-esslingen.de/~melcher/internet-technologien/minesweeper/?",

    //Runs at start of game logic
    async init(size, mines){
        //Object wide variables
        this.size = size;
        this.mines = mines;

        const serverURL = this.server + `request=init&userid=jaduit00&size=${size}&mines=${mines}`;
        const response = await this.fetchAndDecode(serverURL); //Returns a token to identify the ongoing game
        this.token = response.token;
    },

    //Returns the decoded json object returned by the server
    async sweep(x, y){
        const serverURL = this.server + `request=sweep&token=${this.token}&x=${x}&y=${y}`;
        return this.fetchAndDecode(serverURL);
 },

    //Returns the data fetched on url as a json object
    async fetchAndDecode(url){
        const ret = fetch(url).then(res => res.json());
        return ret;
    }
}

//Calls minesweeper.init() as soon as the page is loaded
window.addEventListener("load", event =>{
    minesweeper.init();
});