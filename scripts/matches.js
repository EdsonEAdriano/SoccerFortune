const actualYear = new Date().getFullYear();
const apiData = `https://api.openligadb.de/getmatchdata/bl1/${actualYear}`;
const pageSize = 3;
let totalPages = 0; // Número total de páginas
let actualPage = 1;
let userId = Number(getCookie('userId'));
const fallbackImageUrl = 'imgs/team-default.png';
let allData = [];

// Função para obter os dados das partidas
const getMatches = async () => {
    try {
        const response = await fetch(apiData);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        // Calcula o total de páginas
        totalPages = Math.ceil(data.length / pageSize);

        return data.sort((a, b) => a.matchDateTimeUTC + b.matchDateTimeUTC);;
    } catch (error) {
        console.error('Erro:', error);
        return null;
    }
};

// Função para inicializar a exibição das partidas
const initMatches = async (pageNumber) => {
    try {
        if (allData && allData.length <= 0) {
            allData = await getMatches();
        }

        getBetsByUser(userId, function (user) {
            const bets = user.bets;

            const dataBets = allData
                .map(mainItem => {
                    const secItem = bets.find(sec => sec.matchId === mainItem.matchID);

                    const bet = secItem ? secItem.bet : '';
                    const winnerTeamId = secItem ? secItem.winnerTeamId : '';

                    return { ...mainItem, bet, winnerTeamId };
                })
                .filter(item => item !== null);


            pageNumber = Math.max(pageNumber, 1) - 1; // Ajuste para zero-based index
            const start = pageNumber * pageSize;
            const end = start + pageSize;

            data = dataBets.slice(start, end);

            console.log(data)
            const teamsBackground = document.getElementById('teamsBackground');
            teamsBackground.innerHTML = ''; // Limpa qualquer conteúdo existente

            const title = document.createElement('h1');
            title.textContent = 'Matches';
            title.style.textAlign = 'center'; // Alinha o título ao centro
            teamsBackground.appendChild(title);

            if (data && data.length > 0) {
                data.forEach((match, index) => {
                    const matchContainer = document.createElement('div');
                    matchContainer.className = 'match-container'; // Adiciona a classe para estilização

                    const imagesContainer = document.createElement('div');
                    imagesContainer.className = 'images-container'; // Container para as imagens e placar

                    const team1Image = document.createElement('img');
                    team1Image.alt = 'Team 1 Image';
                    team1Image.style.width = '100px';
                    team1Image.style.height = '100px';

                    const primaryImageUrl = match.team1.teamIconUrl; // A URL da imagem principal               
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

                    const primaryImage2Url = match.team2.teamIconUrl; // A URL da imagem principal
                    loadImageWithFallback(team2Image, primaryImage2Url, fallbackImageUrl);

                    imagesContainer.appendChild(team1Image);
                    imagesContainer.appendChild(vsIcon);
                    imagesContainer.appendChild(team2Image);

                    const scoreboard = document.createElement('p');
                    scoreboard.className = 'scoreboard';
                    let pointsTeam1 = 0;
                    let pointsTeam2 = 0;
                    if (match.matchIsFinished === true && match.matchResults) {
                        match.matchResults.forEach((result) => {
                            pointsTeam1 = result.pointsTeam1;
                            pointsTeam2 = result.pointsTeam2;
                        });
                    }

                    scoreboard.textContent = `${match.team1.shortName} ${pointsTeam1} X ${pointsTeam2} ${match.team2.shortName}`;

                    // Adiciona a data do jogo
                    const dateElement = document.createElement('p');
                    dateElement.className = 'match-date';
                    const matchDate = new Date(match.matchDateTimeUTC);
                    const formattedDate = matchDate.toLocaleDateString(); // Ajuste o formato conforme necessário
                    dateElement.textContent = `Match date: ${formattedDate}`;

                    // Adiciona todos os elementos ao container
                    matchContainer.appendChild(dateElement);
                    matchContainer.appendChild(imagesContainer);
                    matchContainer.appendChild(scoreboard);


                    if (!match.matchIsFinished && match.winnerTeamId == "") {
                        const openBoxBtn = document.createElement('button');
                        openBoxBtn.id = 'openBoxBtn';
                        openBoxBtn.innerText = 'Open Betting Box';

                        const container = document.createElement('div');
                        container.className = 'container-bet';

                        const betBox = document.createElement('div');
                        betBox.className = 'betBox';

                        openBoxBtn.addEventListener('click', function () {
                            if (betBox.style.display === 'none' || betBox.style.display === '') {
                                betBox.style.display = 'block';
                                openBoxBtn.innerText = 'Close Betting Box'
                            } else {
                                betBox.style.display = 'none';
                                openBoxBtn.innerText = 'Open Betting Box'
                            }
                        });

                        const title = document.createElement('h3');
                        title.style.fontSize = '14px';
                        title.style.marginBottom = '8px';
                        title.innerText = 'Who Wins:';
                        betBox.appendChild(title);

                        const radioGroup = document.createElement('div');
                        radioGroup.className = 'radio-group';

                        const chooses = [
                            { id: `choose1_${index}`, label: match.team1.shortName, value: match.team1.teamId, color: 'blue' },
                            { id: `choose2_${index}`, label: 'Draw', value: 0, color: 'gray' },
                            { id: `choose3_${index}`, label: match.team2.shortName, value: match.team1.teamId, color: 'red' }
                        ];

                        chooses.forEach(function (choose) {
                            const input = document.createElement('input');
                            input.type = 'radio';
                            input.id = choose.id;
                            input.name = `choose_${index}`;
                            input.value = choose.value;

                            const label = document.createElement('label');
                            label.htmlFor = choose.id;
                            label.style.color = choose.color;
                            label.innerText = choose.label;

                            radioGroup.appendChild(input);
                            radioGroup.appendChild(label);
                        });

                        betBox.appendChild(radioGroup);

                        const pointsLabel = document.createElement('label');
                        pointsLabel.style.fontSize = '12px';
                        pointsLabel.htmlFor = `points_${index}`;
                        pointsLabel.innerText = 'Insert the points:';
                        betBox.appendChild(pointsLabel);

                        const pointsInput = document.createElement('input');
                        pointsInput.type = 'number';
                        pointsInput.className = 'points';
                        pointsInput.name = `points_${index}`;
                        pointsInput.min = '1';
                        pointsInput.step = '1';
                        betBox.appendChild(pointsInput);

                        const betBtn = document.createElement('button');
                        betBtn.className = 'betBtn';
                        betBtn.innerText = 'Bet';
                        betBtn.addEventListener('click', function () {
                            const selectedBet = document.querySelector(`input[name="choose_${index}"]:checked`);
                            const winnerTeamId = selectedBet ? selectedBet.value : null;
                            const points = pointsInput.value;

                            const userId = Number(getCookie('userId'));

                            if (winnerTeamId && points > 0) {
                                bet(userId, match.matchID, winnerTeamId, points);
                                initMatches(actualPage);
                            } else {
                                alert('Insert your choose and points')
                            }

                            selectedBet.checked = false;
                            pointsInput.value = '';
                        });
                        betBox.appendChild(betBtn);

                        betBox.style.display = 'none';

                        container.appendChild(openBoxBtn);
                        container.appendChild(betBox);
                        matchContainer.appendChild(container);
                    } else if (!match.matchIsFinished && match.winnerTeamId !== "") {
                        const container = document.createElement('div');
                        container.className = 'container-bet';

                        
                        const cancelBetBtn = document.createElement('button')
                        cancelBetBtn.id = 'cancelBetBtn';
                        cancelBetBtn.innerText = 'Cancel Bet';
                        cancelBetBtn.onclick = () => {
                            cancelBet(userId, match.matchID);
                            initMatches(actualPage);
                        }

                        container.appendChild(cancelBetBtn);
                        matchContainer.appendChild(container);
                    }


                    teamsBackground.appendChild(matchContainer);
                });


                createPaginator();
            } else {
                teamsBackground.innerHTML = 'Nenhuma partida encontrada.';
            }
        });


    } catch (error) {
        console.error('Erro ao carregar os dados:', error);
        const teamsBackground = document.getElementById('teamsBackground');
        teamsBackground.innerHTML = 'Erro ao carregar os dados.';
    }
};

// Função para criar o paginator
function createPaginator() {
    const teamsBackground = document.getElementById('teamsBackground');

    // Cria o div para o conteúdo
    const contentDiv = document.createElement('div');
    contentDiv.id = 'content';
    teamsBackground.appendChild(contentDiv);

    // Cria o div para os botões de paginação
    const paginatorDiv = document.createElement('div');
    paginatorDiv.id = 'paginator';
    paginatorDiv.className = 'paginator';
    teamsBackground.appendChild(paginatorDiv);

    const beforeButton = document.createElement('button');
    beforeButton.innerText = '<';
    beforeButton.disabled = actualPage === 1; // Desativa o botão se estiver na primeira página
    beforeButton.onclick = () => {
        actualPage--;
        initMatches(actualPage);
    };
    paginatorDiv.appendChild(beforeButton);

    let initialIndex = Math.max(1, Math.floor((actualPage) / 5) * 5);
    let endIndex = Math.min(totalPages, initialIndex + 5);

    for (let i = initialIndex; i <= endIndex; i++) {
        const button = document.createElement('button');
        button.innerText = i;
        button.classList.toggle('active', i === actualPage);
        button.onclick = () => {
            actualPage = i;
            initMatches(i);
        };
        paginatorDiv.appendChild(button);
    }

    const afterButton = document.createElement('button');
    afterButton.innerText = '>';
    afterButton.disabled = actualPage === totalPages; // Desativa o botão se estiver na última página
    afterButton.onclick = () => {
        actualPage++;
        initMatches(actualPage);
    };
    paginatorDiv.appendChild(afterButton);
}



// Função para atualizar o estado dos botões de paginação
function updatePaginator(currentPage) {
    const buttons = document.querySelectorAll('#paginator button');
    buttons.forEach((button, index) => {
        button.classList.toggle('active', button.innerText == currentPage);
    });
}

function loadImageWithFallback(imgElement, primaryUrl, fallbackUrl) {
    imgElement.src = primaryUrl;

    imgElement.onload = function () {
        imgElement.onload = null; // Limpa o evento
    };

    imgElement.onerror = function () {
        imgElement.src = fallbackUrl;
    };
}

// Inicializa a primeira página quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    initMatches(actualPage);
});

