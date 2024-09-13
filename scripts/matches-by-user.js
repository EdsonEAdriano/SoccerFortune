const actualYear = new Date().getFullYear();
const apiData = `https://api.openligadb.de/getmatchdata/bl1/${actualYear}`;
const pageSize = 3;
let totalPages = 0;
let actualPage = 1;
let userId = Number(getCookie('userId'));
const fallbackImageUrl = 'imgs/team-default.png';
let allData = [];

const getMatches = async () => {
    try {
        const response = await fetch(apiData);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        return data.sort((a, b) => a.matchDateTimeUTC + b.matchDateTimeUTC);
    } catch (error) {
        console.error('Erro:', error);
        return null;
    }
};

const initMatchesByUser = async (pageNumber) => {
    try {
        if (allData && allData.length <= 0) {
            allData = await getMatches();
        }

        getBetsByUser(userId, function (user) {
            const bets = user.bets;
            
            const dataBets = allData
                .filter(mainItem =>
                    bets.some(secItem =>
                        secItem.matchId === mainItem.matchID
                    )
                )
                .map(mainItem => {
                    const secItem = bets.find(sec => sec.matchId === mainItem.matchID);

                    return { ...mainItem, bet: secItem.bet, winnerTeamId: secItem.winnerTeamId };
                })
                .filter(item => item !== null);

            
            totalPages = Math.ceil(dataBets.length / pageSize);


            pageNumber = Math.max(actualPage, 1) - 1;
            const start = pageNumber * pageSize;
            const end = start + pageSize;

            data = dataBets.slice(start, end);
            
            const teamsBackground = document.getElementById('teamsBackground');
            teamsBackground.innerHTML = '';

            const title = document.createElement('h1');
            title.textContent = 'Your Bets';
            title.style.textAlign = 'center';
            teamsBackground.appendChild(title);

            if (data && data.length > 0) {
                data.forEach((match, index) => {
                    const matchContainer = document.createElement('div');
                    matchContainer.className = 'match-container';

                    const imagesContainer = document.createElement('div');
                    imagesContainer.className = 'images-container';

                    const team1Image = document.createElement('img');
                    team1Image.alt = 'Team 1 Image';
                    team1Image.style.width = '100px';
                    team1Image.style.height = '100px';

                    const primaryImageUrl = match.team1.teamIconUrl;
                    loadImageWithFallback(team1Image, primaryImageUrl, fallbackImageUrl);

                    const vsIcon = document.createElement('img');
                    vsIcon.src = 'imgs/vs.png';
                    vsIcon.alt = 'VS Icon';
                    vsIcon.style.width = '50px';
                    vsIcon.style.height = '50px';
                    vsIcon.style.marginLeft = '20px';
                    vsIcon.style.marginRight = '20px';

                    const team2Image = document.createElement('img');
                    team2Image.alt = 'Team 2 Image';
                    team2Image.style.width = '100px';
                    team2Image.style.height = '100px';

                    const primaryImage2Url = match.team2.teamIconUrl;
                    loadImageWithFallback(team2Image, primaryImage2Url, fallbackImageUrl);

                    imagesContainer.appendChild(team1Image);
                    imagesContainer.appendChild(vsIcon);
                    imagesContainer.appendChild(team2Image);

                    const scoreboard = document.createElement('p');
                    scoreboard.className = 'scoreboard';
                    let pointsTeam1 = 0;
                    let pointsTeam2 = 0;
                    if (match.matchIsFinished && match.matchResults) {
                        match.matchResults.forEach((result) => {
                            pointsTeam1 = result.pointsTeam1;
                            pointsTeam2 = result.pointsTeam2;
                        });
                    }

                    scoreboard.textContent = `${match.team1.shortName} ${pointsTeam1} X ${pointsTeam2} ${match.team2.shortName}`;

                    const dateElement = document.createElement('p');
                    dateElement.className = 'match-date';
                    const matchDate = new Date(match.matchDateTimeUTC);
                    const formattedDate = matchDate.toLocaleDateString();
                    dateElement.textContent = `Match Date: ${formattedDate}`;


                    const yourBet = document.createElement('p');
                    
                    if (match.matchIsFinished) {
                        const secondResult = match.matchResults[1];
                        let isWinnerMatch = false;
                        let winnerTeamName = match.winnerTeamId === match.team1.teamId ? match.team1.shortName : match.team2.shortName;

                        if (secondResult) {
                            if (secondResult.pointsTeam1 > secondResult.pointsTeam2) {
                                isWinnerMatch = match.winnerTeamId === match.team1.teamId;
                            } else if (secondResult.pointsTeam2 > secondResult.pointsTeam1) {
                                isWinnerMatch = match.winnerTeamId === match.team2.teamId;
                            } else {
                                isWinnerMatch = match.winnerTeamId === 0;
                            }
                        }

                        
                        if (isWinnerMatch) {
                            if (match.winnerTeamId != 0) {
                                yourBet.textContent = `You bet ${match.bet} points on ${winnerTeamName} and won a ${match.bet * 1.75} prize.`;
                            } else {
                                yourBet.textContent = `You bet ${match.bet} points on a draw and won a prize of ${match.bet * 1.75}.`;
                            }
                            yourBet.style.color = 'green';
                        } else {
                            if (match.winnerTeamId != 0) {
                                yourBet.textContent = `You bet ${match.bet} points on ${winnerTeamName} but you lost.`;
                            } else {
                                yourBet.textContent = `You bet ${match.bet} points on a draw but you lost.`;
                            }
                            yourBet.style.color = 'red';
                        }
                    } 







                    matchContainer.appendChild(dateElement);
                    matchContainer.appendChild(imagesContainer);
                    matchContainer.appendChild(scoreboard);
                    matchContainer.appendChild(yourBet);



                    if (!match.matchIsFinished) {
                        const container = document.createElement('div');
                        container.className = 'container-bet';

                        
                        const cancelBetBtn = document.createElement('button')
                        cancelBetBtn.id = 'cancelBetBtn';
                        cancelBetBtn.innerText = 'Cancel Bet';
                        cancelBetBtn.onclick = () => {
                            cancelBet(userId, match.matchID);
                            initMatchesByUser(actualPage);
                            updatePointsUsername();
                        }

                        container.appendChild(cancelBetBtn);
                        matchContainer.appendChild(container);
                    }

                    teamsBackground.appendChild(matchContainer);
                });

                createPaginatorByUser(userId);
            } else {
                teamsBackground.innerHTML = 'No bets were placed on this account.';
            }
        });
    } catch (error) {
        console.error('Erro ao carregar os dados:', error);
        const teamsBackground = document.getElementById('teamsBackground');
        teamsBackground.innerHTML = 'Erro ao carregar os dados.';
    }
};

function createPaginatorByUser() {
    const teamsBackground = document.getElementById('teamsBackground');

    const contentDiv = document.createElement('div');
    contentDiv.id = 'content';
    teamsBackground.appendChild(contentDiv);

    const paginatorDiv = document.createElement('div');
    paginatorDiv.id = 'paginator';
    paginatorDiv.className = 'paginator';
    teamsBackground.appendChild(paginatorDiv);

    const beforeButton = document.createElement('button');
    beforeButton.innerText = '<';
    beforeButton.disabled = actualPage === 1;
    beforeButton.onclick = () => {
        actualPage--;
        initMatchesByUser(userId, actualPage);
    };
    paginatorDiv.appendChild(beforeButton);

    let initialIndex = Math.max(1, Math.floor((actualPage) / 5) * 5);
    let endIndex = Math.min(totalPages, initialIndex + 5);

    for (let i = initialIndex; i <= endIndex; i++) {
        const button = document.createElement('button');
        button.innerText = i;
        button.classList.toggle('active', i === actualPage);
        button.disabled = i > totalPages;
        button.onclick = () => {
            actualPage = i;
            initMatchesByUser(userId, i);
        };
        paginatorDiv.appendChild(button);
    }

    const afterButton = document.createElement('button');
    afterButton.innerText = '>';
    afterButton.disabled = actualPage === totalPages;
    afterButton.onclick = () => {
        actualPage++;
        console.log(actualPage)
        initMatchesByUser(userId, actualPage);
    };
    paginatorDiv.appendChild(afterButton);
}


const verifyBets = async () => {
    try {
        if (allData && allData.length <= 0) {
            allData = await getMatches();
        }

        getBetsByUser(userId, function (user) {
            const bets = user.bets;
            const auxiliarMatchIds = new Set(
                bets
                    .filter(item => item.betVerified === false)
                    .map(item => ({ matchId: item.matchId, winnerTeamId: item.winnerTeamId }))
            );

            data = allData.filter(item =>
                auxiliarMatchIds.has({ matchId: item.matchID, winnerTeamId: item.team2.teamId })
            );


            const filteredMainList = allData
                .filter(mainItem =>
                    mainItem.matchIsFinished &&
                    bets.some(secItem =>
                        secItem.matchId === mainItem.matchID && !secItem.betVerified
                    )
                )
                .map(mainItem => {
                    const secItem = bets.find(sec => sec.matchId === mainItem.matchID);
                    const secondResult = mainItem.matchResults[1]; // Pegando o segundo resultado
                    const { team1, team2 } = mainItem;

                    // Condições de verificação
                    let isWinnerMatch = false;
                    if (secondResult) {
                        if (secondResult.pointsTeam1 > secondResult.pointsTeam2) {
                            isWinnerMatch = Number(secItem.winnerTeamId) === team1.teamId;
                        } else if (secondResult.pointsTeam2 > secondResult.pointsTeam1) {
                            isWinnerMatch = Number(secItem.winnerTeamId) === team2.teamId;
                        } else {
                            isWinnerMatch = secItem.winnerTeamId === 0;
                        }
                    }

                    return isWinnerMatch ? { ...mainItem, bet: secItem.bet } : null;
                })
                .filter(item => item !== null);

            let totalBets = filteredMainList.reduce((sum, item) => sum + (item.bet || 0), 0);

            if (totalBets > 0) {
                totalBets *= 1.75;

                updatePoints(userId, totalBets);

                closeBets(userId);

                createAndShowPopup(totalBets);

                updatePointsUsername();
            }



        });
    } catch (error) {
        console.error('Erro ao carregar os dados:', error);
        const teamsBackground = document.getElementById('teamsBackground');
        teamsBackground.innerHTML = 'Erro ao carregar os dados.';
    }
}


function createAndShowPopup(points) {
    // Cria o overlay
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.id = 'popup-overlay';

    // Cria a popup
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.id = 'popup';

    // Cria a mensagem
    const message = document.createElement('p');
    message.id = 'popup-message';
    message.textContent = `You've earned ${points} points!`;
    popup.appendChild(message);

    // Cria o botão de fechar
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Fechar';
    closeButton.onclick = hidePopup;
    popup.appendChild(closeButton);

    // Adiciona a popup e o overlay ao body
    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    // Mostra a popup e o overlay
    overlay.style.display = 'block';
    popup.style.display = 'block';
}

// Função para esconder a popup
function hidePopup() {
    const popup = document.getElementById('popup');
    const overlay = document.getElementById('popup-overlay');
    if (popup) popup.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}

function loadImageWithFallback(imageElement, primaryUrl, fallbackUrl) {
    imageElement.src = primaryUrl;
    imageElement.onerror = function () {
        imageElement.src = fallbackUrl;
    };
}

window.onload = async function () {
    initMatchesByUser(1);
};
