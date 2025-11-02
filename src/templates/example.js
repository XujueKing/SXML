// Reactive counter with SXML
let counter = 0;

function incrementCounter() {
    counter++;
    updateCounter();
    showMessage('Counter incremented!');
}

function decrementCounter() {
    counter--;
    updateCounter();
    showMessage('Counter decremented!');
}

function updateCounter() {
    const countElement = document.getElementById('count');
    if (countElement) {
        countElement.textContent = counter;
    }
}

function showMessage(msg) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.textContent = msg;
        setTimeout(() => {
            messageElement.textContent = '';
        }, 2000);
    }
}

console.log('SXML Example loaded successfully!');
