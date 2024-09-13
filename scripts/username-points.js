// const userId = Number(getCookie('userId'));
// const user = getBetsByUser(userId, (user) => {
//     alert(user)
//     return user;
// })

const updatePointsCounter = (points) => {
    const pointsCounter = document.getElementById('points-counter');
    pointsCounter.textContent = `Points: ${points}`;
}


const updateWelcomeMessage = (username) => {
    const welcomeMessage = document.getElementById('welcome-message');
    if (username) {
        welcomeMessage.textContent = `Welcome, ${username}`;
    } else {
        welcomeMessage.textContent = 'Welcome, Guest';
    }
};

const updatePointsUsername = () => {
    const userId = Number(getCookie('userId'));
    getBetsByUser(userId, (user) => {
        updatePointsCounter(user.points);
        updateWelcomeMessage(user.username);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updatePointsUsername();
});