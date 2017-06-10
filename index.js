const electron = require('electron');
const { app, BrowserWindow, Menu, ipcMain } = electron;

let mainWindow;
let addWindow;

/**
 * Crea una nuova finestra per l'aggiunta
 * di una nuova TODO
 */
function createAddWindow() {
    addWindow = new BrowserWindow({
        width: 400,
        height: 300,
        title: 'Add New Todo'
    });
    addWindow.loadURL(`file://${__dirname}/add.html`);
    // quando si crea la finestra di un browser, alla chiusura 
    // non viene distrutto il puntamento all'oggetto finestra
    // quindi il garbage collector di JavaScript non pulisce
    // per evitare di ricordarsi di annullare sempre il puntamento
    // dopo la close si può registrare un listeners che si occupi
    // di annullare il puntamento e consenta a Javascript di pulire
    // la memoria
    addWindow.on('closed', () => addWindow = null);
}

function clearTodos() {
    mainWindow.webContents.send('todo:clear-todos');
}

// Template per il menu principale
const menuTemplate = [
    {
        label: 'File',
        submenu: [
            { 
                label: 'New Todo',
                click() { createAddWindow(); },
                accelerator: process.platform === 'darwin' ? 'Command+N' : 'Ctrl+N'
            }, 
            {
                label: 'Clear Todos',
                click() { clearTodos(); },
                accelerator: process.platform === 'darwin' ? 'Command+L' : 'Ctrl+L'
            },
            { 
                label: 'Quit',
                accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click() { app.quit(); }
            },
    ],
}];

// Se la piattaforma è macOSX allora viene aggiunto un elemento
// vuoto al menu principale, per convenzione su questa piattaforma
// se no il primo elemento del menu viene accorpato con il nome 
// dell'applicazione.
if ( process.platform === 'darwin' ) {
    menuTemplate.unshift([{}]);
}

// Se l'applicazione non è in ambiente di produzione 
// viene aggiunto al menu il tasto View e con le opzioni
// per lo sviluppatore.
if ( process.env.NODE_ENV !== 'production' ) {
    // Valori normalmente utilizzati nel mondo
    // 'production'
    // 'development'
    // 'staging'
    // 'test'
    menuTemplate.push({
        label: 'View',
        submenu: [{
            role: 'reload'
        },{
            label: 'Toggle Developer Tools',
            // il primo argomento è l'elemento di menu cliccato,
            // il secondo argomento è il reference alla finestra in focus
            click(item, focusedWindow) {
                focusedWindow.toggleDevTools();
            },
            accelerator: process.platform === 'darwin' ? 'Command+Alt+I' : 'Ctrl+Shift+I'
        }]
    });
}

// ENTRY POINT
app.on('ready', () => {
    // Creazione finestra principale
    mainWindow = new BrowserWindow({});
    // Carica il file html principale
    mainWindow.loadURL(`file://${__dirname}/main.html`);
    // Se la finestra principale viene chiusa
    // allora viene chiuso il processo principale, quindi con esso 
    // anche i processi figli ( Ad esempio altre finestre )
    mainWindow.on('closed', () => {
        app.quit();
    });
    // Crea un menu custom
    const mainMenu = Menu.buildFromTemplate(menuTemplate);
    // Setta il menu come menu principale dell'applicazione
    Menu.setApplicationMenu(mainMenu);
});


// GESTIONE IPC
/**
 * Creazione di una nuova TODO
 */
ipcMain.on('todo:add', (event, todo) => {
    // Una volta ricevuto il messaggio di creazione di una TODO
    // da parte di una finestra figlia lo inoltro alla finestra principale
    mainWindow.webContents.send('todo:add', todo);
    addWindow.close();
});