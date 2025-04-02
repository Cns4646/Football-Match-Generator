document.addEventListener("DOMContentLoaded", () => {
    const leagueSelect = document.getElementById("league-select");
    const homeTeamSelect = document.getElementById("home-team");
    const awayTeamSelect = document.getElementById("away-team");
    const venueInput = document.getElementById("venue");
    const matchDateInput = document.getElementById("match-date");
    const matchStatusSelect = document.getElementById("match-status");
    const homeScoreInput = document.getElementById("home-score");
    const awayScoreInput = document.getElementById("away-score");
    const generateButton = document.getElementById("generate-match");
    const randomButton = document.getElementById("random-match");
    const resultDiv = document.getElementById("result");
    const historyList = document.getElementById("history-list");
    const languageSelect = document.getElementById("language-select");
    let matches = JSON.parse(localStorage.getItem("matchHistory")) || [];

    // Language translations
    const translations = {
        en: {
            title: "Football Match Generator",
            leagueLabel: "Select League:",
            homeLabel: "Home Team:",
            awayLabel: "Away Team:",
            venueLabel: "Venue:",
            dateLabel: "Match Date:",
            statusLabel: "Match Status:",
            homeScoreLabel: "Home Score:",
            awayScoreLabel: "Away Score:",
            generate: "Generate Match",
            random: "Generate Random Match",
            historyTitle: "Match History",
            delete: "Delete",
            download: "Download JSON"
        },
        my: {
            title: "ဘောလုံးပွဲစဉ် ဖန်တီးသူ",
            leagueLabel: "လိဂ်ရွေးပါ:",
            homeLabel: "အိမ်ကွင်းအသင်း:",
            awayLabel: "ဧည့်ကွင်းအသင်း:",
            venueLabel: "ကွင်းနေရာ:",
            dateLabel: "ပွဲရက်စွဲ:",
            statusLabel: "ပွဲအခြေအနေ:",
            homeScoreLabel: "အိမ်ကွင်းဂိုး:",
            awayScoreLabel: "ဧည့်ကွင်းဂိုး:",
            generate: "ပွဲဖန်တီးပါ",
            random: "ပွဲအကြုံဖန်တီးပါ",
            historyTitle: "ပွဲမှတ်တမ်း",
            delete: "ဖျက်ပါ",
            download: "JSON ဒေါင်းလုပ်ပါ"
        }
    };

    let currentLang = "en";
    updateLanguage();

    // Populate leagues
    footballData.leagues.forEach(league => {
        const option = document.createElement("option");
        option.value = league.league_name;
        option.textContent = `${league.league_name} (${league.country})`;
        leagueSelect.appendChild(option);
    });

    renderHistory();

    // Language change
    languageSelect.addEventListener("change", (e) => {
        currentLang = e.target.value;
        updateLanguage();
    });

    // League selection
    leagueSelect.addEventListener("change", (e) => {
        resetForm();
        const selectedLeague = e.target.value;
        if (selectedLeague) {
            const league = footballData.leagues.find(l => l.league_name === selectedLeague);
            league.teams.forEach(team => {
                const option = document.createElement("option");
                option.value = team.id;
                option.textContent = team.team_name;
                homeTeamSelect.appendChild(option);
            });
            homeTeamSelect.disabled = false;
        }
    });

    // Home team selection
    homeTeamSelect.addEventListener("change", (e) => {
        const selectedHomeTeamId = e.target.value;
        awayTeamSelect.innerHTML = '<option value="">-- Select Away Team --</option>';
        if (selectedHomeTeamId) {
            const league = footballData.leagues.find(l => l.league_name === leagueSelect.value);
            const homeTeam = league.teams.find(t => t.id == selectedHomeTeamId);
            venueInput.value = homeTeam.venue; // Auto-fill venue
            league.teams.forEach(team => {
                if (team.id != selectedHomeTeamId) {
                    const option = document.createElement("option");
                    option.value = team.id;
                    option.textContent = team.team_name;
                    awayTeamSelect.appendChild(option);
                }
            });
            awayTeamSelect.disabled = false;
            venueInput.disabled = false;
        }
    });

    // Away team selection
    awayTeamSelect.addEventListener("change", () => {
        matchDateInput.disabled = false;
    });

    // Match date selection
    matchDateInput.addEventListener("change", () => {
        matchStatusSelect.disabled = false;
    });

    // Match status selection
    matchStatusSelect.addEventListener("change", () => {
        const status = matchStatusSelect.value;
        const scoreContainer = document.getElementById("score-container");
        if (status === "Live" || status === "Finished") {
            scoreContainer.style.display = "block";
            homeScoreInput.disabled = false;
            awayScoreInput.disabled = false;
            generateButton.disabled = false;
        } else {
            scoreContainer.style.display = "none";
            homeScoreInput.disabled = true;
            awayScoreInput.disabled = true;
            generateButton.disabled = false;
        }
    });

    // Generate match
    generateButton.addEventListener("click", () => {
        if (!validateForm()) return;
        const matchData = createMatchData();
        saveAndDisplayMatch(matchData);
    });

    // Generate random match
    randomButton.addEventListener("click", () => {
        const league = footballData.leagues[Math.floor(Math.random() * footballData.leagues.length)];
        const teams = league.teams;
        const homeTeam = teams[Math.floor(Math.random() * teams.length)];
        const awayTeams = teams.filter(t => t.id !== homeTeam.id);
        const awayTeam = awayTeams[Math.floor(Math.random() * awayTeams.length)];
        const statuses = ["Not Started", "Live", "Finished", "Postponed"];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        const now = new Date();
        now.setDate(now.getDate() + Math.floor(Math.random() * 10)); // Random date within 10 days
        const randomDate = now.toISOString().slice(0, 16);

        const leagueAbbr = league.league_name.split(" ").map(word => word[0]).join("").toUpperCase();
        const homeAbbr = homeTeam.team_name.split(" ").map(word => word[0]).join("").toUpperCase();
        const awayAbbr = awayTeam.team_name.split(" ").map(word => word[0]).join("").toUpperCase();
        const dateStr = randomDate.replace(/[-T:]/g, "").slice(0, 8);
        const matchId = `${leagueAbbr}-${homeAbbr}-${awayAbbr}-${dateStr}`;

        const matchData = {
            match_id: matchId,
            league: league.league_name,
            home_team: {
                id: homeTeam.id,
                title: homeTeam.team_name,
                image_link: homeTeam.image_link
            },
            away_team: {
                id: awayTeam.id,
                title: awayTeam.team_name,
                image_link: awayTeam.image_link
            },
            venue: homeTeam.venue,
            match_date: randomDate,
            status: randomStatus,
            score: (randomStatus === "Live" || randomStatus === "Finished") ? {
                home: Math.floor(Math.random() * 5),
                away: Math.floor(Math.random() * 5)
            } : null
        };

        saveAndDisplayMatch(matchData);
    });

    // History delete (Event Delegation)
    historyList.addEventListener("click", (e) => {
        if (e.target.tagName === "BUTTON") {
            const index = e.target.dataset.index;
            deleteMatch(index);
        }
    });

    // Functions
    function resetForm() {
        homeTeamSelect.innerHTML = '<option value="">-- Select Home Team --</option>';
        awayTeamSelect.innerHTML = '<option value="">-- Select Away Team --</option>';
        venueInput.value = "";
        matchDateInput.value = "";
        matchStatusSelect.value = "";
        homeScoreInput.value = "0";
        awayScoreInput.value = "0";
        document.getElementById("score-container").style.display = "none";
        homeTeamSelect.disabled = true;
        awayTeamSelect.disabled = true;
        venueInput.disabled = true;
        matchDateInput.disabled = true;
        matchStatusSelect.disabled = true;
        homeScoreInput.disabled = true;
        awayScoreInput.disabled = true;
        generateButton.disabled = true;
    }

    function validateForm() {
        if (!leagueSelect.value) { alert(translations[currentLang].leagueLabel + " is required!"); return false; }
        if (!homeTeamSelect.value) { alert(translations[currentLang].homeLabel + " is required!"); return false; }
        if (!awayTeamSelect.value) { alert(translations[currentLang].awayLabel + " is required!"); return false; }
        if (!venueInput.value) { alert(translations[currentLang].venueLabel + " is required!"); return false; }
        if (!matchDateInput.value) { alert(translations[currentLang].dateLabel + " is required!"); return false; }
        if (!matchStatusSelect.value) { alert(translations[currentLang].statusLabel + " is required!"); return false; }
        return true;
    }

    function createMatchData() {
        const league = footballData.leagues.find(l => l.league_name === leagueSelect.value);
        const homeTeam = league.teams.find(t => t.id == homeTeamSelect.value);
        const awayTeam = league.teams.find(t => t.id == awayTeamSelect.value);

        const leagueAbbr = league.league_name.split(" ").map(word => word[0]).join("").toUpperCase();
        const homeAbbr = homeTeam.team_name.split(" ").map(word => word[0]).join("").toUpperCase();
        const awayAbbr = awayTeam.team_name.split(" ").map(word => word[0]).join("").toUpperCase();
        const dateStr = matchDateInput.value.replace(/[-T:]/g, "").slice(0, 8);
        const matchId = `${leagueAbbr}-${homeAbbr}-${awayAbbr}-${dateStr}`;

        return {
            match_id: matchId,
            league: league.league_name,
            home_team: {
                id: homeTeam.id,
                title: homeTeam.team_name,
                image_link: homeTeam.image_link
            },
            away_team: {
                id: awayTeam.id,
                title: awayTeam.team_name,
                image_link: awayTeam.image_link
            },
            venue: venueInput.value,
            match_date: matchDateInput.value,
            status: matchStatusSelect.value,
            score: (matchStatusSelect.value === "Live" || matchStatusSelect.value === "Finished") ? {
                home: parseInt(homeScoreInput.value),
                away: parseInt(awayScoreInput.value)
            } : null
        };
    }

    function saveAndDisplayMatch(matchData) {
        matches.push(matchData);
        localStorage.setItem("matchHistory", JSON.stringify(matches));
        renderHistory();
        displayMatch(matchData);
    }

    function displayMatch(match) {
        resultDiv.style.display = "block";
        resultDiv.innerHTML = `
            <div class="match-display">
                <div><img src="${match.home_team.image_link}" alt="${match.home_team.title}"><br>${match.home_team.title}</div>
                <div class="score">${match.score ? `${match.score.home} - ${match.score.away}` : "VS"}</div>
                <div><img src="${match.away_team.image_link}" alt="${match.away_team.title}"><br>${match.away_team.title}</div>
            </div>
            <p>League: ${match.league}</p>
            <p>Venue: ${match.venue}</p>
            <p>Date: ${new Date(match.match_date).toLocaleString()}</p>
            <p>Status: ${match.status}</p>
            <button onclick='downloadJSON(${JSON.stringify(match)})'>${translations[currentLang].download}</button>
            <pre>${JSON.stringify(match, null, 2)}</pre>
        `;
    }

    function renderHistory() {
        historyList.innerHTML = "";
        matches.forEach((match, index) => {
            const li = document.createElement("li");
            li.innerHTML = `
                ${match.home_team.title} ${match.score ? `${match.score.home} - ${match.score.away}` : "VS"} ${match.away_team.title} (${match.league}, ${new Date(match.match_date).toLocaleDateString()})
                <button data-index="${index}">${translations[currentLang].delete}</button>
            `;
            historyList.appendChild(li);
        });
    }

    function deleteMatch(index) {
        matches.splice(index, 1);
        localStorage.setItem("matchHistory", JSON.stringify(matches));
        renderHistory();
    }

    function downloadJSON(match) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(match));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `${match.match_id}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }

    function updateLanguage() {
        document.getElementById("title").textContent = translations[currentLang].title;
        document.getElementById("league-label").textContent = translations[currentLang].leagueLabel;
        document.getElementById("home-label").textContent = translations[currentLang].homeLabel;
        document.getElementById("away-label").textContent = translations[currentLang].awayLabel;
        document.getElementById("venue-label").textContent = translations[currentLang].venueLabel;
        document.getElementById("date-label").textContent = translations[currentLang].dateLabel;
        document.getElementById("status-label").textContent = translations[currentLang].statusLabel;
        document.getElementById("home-score-label").textContent = translations[currentLang].homeScoreLabel;
        document.getElementById("away-score-label").textContent = translations[currentLang].awayScoreLabel;
        document.getElementById("generate-match").textContent = translations[currentLang].generate;
        document.getElementById("random-match").textContent = translations[currentLang].random;
        document.getElementById("history-title").textContent = translations[currentLang].historyTitle;
        renderHistory();
        if (resultDiv.style.display === "block") {
            const lastMatch = matches[matches.length - 1];
            if (lastMatch) displayMatch(lastMatch);
        }
    }
});
