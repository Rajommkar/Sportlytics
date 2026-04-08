// === Dashboard Logic ===
let matchChartInstance = null;
let currentStats = null;

// Scorecard field definitions per sport
const SCORECARD_FIELDS = {
    football: [
        { key: 'goals', label: 'Goals', type: 'number', min: 0 },
        { key: 'assists', label: 'Assists', type: 'number', min: 0 },
        { key: 'passes', label: 'Passes', type: 'number', min: 0 },
        { key: 'passAccuracy', label: 'Pass Accuracy %', type: 'number', min: 0, max: 100 },
        { key: 'shots', label: 'Shots', type: 'number', min: 0 },
        { key: 'shotsOnTarget', label: 'Shots on Target', type: 'number', min: 0 },
        { key: 'tackles', label: 'Tackles', type: 'number', min: 0 },
        { key: 'interceptions', label: 'Interceptions', type: 'number', min: 0 },
        { key: 'distanceCovered', label: 'Distance (km)', type: 'number', min: 0, step: '0.1' }
    ],
    basketball: [
        { key: 'points', label: 'Points', type: 'number', min: 0 },
        { key: 'rebounds', label: 'Rebounds', type: 'number', min: 0 },
        { key: 'assists', label: 'Assists', type: 'number', min: 0 },
        { key: 'steals', label: 'Steals', type: 'number', min: 0 },
        { key: 'blocks', label: 'Blocks', type: 'number', min: 0 },
        { key: 'turnovers', label: 'Turnovers', type: 'number', min: 0 },
        { key: 'fieldGoals', label: 'Field Goals Made', type: 'number', min: 0 },
        { key: 'fieldGoalAttempts', label: 'FG Attempts', type: 'number', min: 0 },
        { key: 'threePointers', label: '3-Pointers Made', type: 'number', min: 0 },
        { key: 'freeThrows', label: 'Free Throws Made', type: 'number', min: 0 }
    ],
    cricket: [
        { key: 'runsScored', label: 'Runs Scored', type: 'number', min: 0 },
        { key: 'ballsFaced', label: 'Balls Faced', type: 'number', min: 0 },
        { key: 'fours', label: 'Fours', type: 'number', min: 0 },
        { key: 'sixes', label: 'Sixes', type: 'number', min: 0 },
        { key: 'wicketsTaken', label: 'Wickets Taken', type: 'number', min: 0 },
        { key: 'oversBowled', label: 'Overs Bowled', type: 'number', min: 0, step: '0.1' },
        { key: 'runsConceded', label: 'Runs Conceded', type: 'number', min: 0 },
        { key: 'catches', label: 'Catches', type: 'number', min: 0 },
        { key: 'runOuts', label: 'Run Outs', type: 'number', min: 0 }
    ],
    running: [
        { key: 'distance', label: 'Distance (km)', type: 'number', min: 0, step: '0.01' },
        { key: 'pace', label: 'Pace (min/km)', type: 'number', min: 0, step: '0.01' },
        { key: 'calories', label: 'Calories Burned', type: 'number', min: 0 },
        { key: 'elevationGain', label: 'Elevation (m)', type: 'number', min: 0 },
        { key: 'avgHeartRate', label: 'Avg Heart Rate', type: 'number', min: 0 },
        { key: 'maxHeartRate', label: 'Max Heart Rate', type: 'number', min: 0 }
    ],
    tennis: [
        { key: 'aces', label: 'Aces', type: 'number', min: 0 },
        { key: 'doubleFaults', label: 'Double Faults', type: 'number', min: 0 },
        { key: 'firstServePercent', label: '1st Serve %', type: 'number', min: 0, max: 100 },
        { key: 'winnersHit', label: 'Winners', type: 'number', min: 0 },
        { key: 'unforcedErrors', label: 'Unforced Errors', type: 'number', min: 0 },
        { key: 'setsWon', label: 'Sets Won', type: 'number', min: 0 },
        { key: 'setsLost', label: 'Sets Lost', type: 'number', min: 0 }
    ]
};

// --- Init ---
async function initDashboard() {
    if (!requireAuth()) return;
    try {
        const res = await fetch(`${API_URL}/user/profile`, { headers: { 'x-auth-token': getToken() } });
        if (!res.ok) throw new Error('Auth failed');
        const user = await res.json();

        document.getElementById('user-display-name').innerText = user.name;
        document.getElementById('dash-score').innerText = user.efficiencyScore.toFixed(1);
        document.getElementById('dash-matches').innerText = user.totalMatchesLogged || 0;

        renderBadges(user.badges || []);
        renderGoals(user.goals || []);
        fetchMatches();
        fetchStats();
        fetchTeam();

        setTimeout(() => { hideLoader(); initScrollObserver(); }, 800);
    } catch (err) { console.error(err); logout(); }
}

// --- Sport Selector for Scorecard ---
function onSportChange() {
    const sport = document.getElementById('log-sport').value;
    const container = document.getElementById('scorecard-fields');
    container.innerHTML = '';
    const fields = SCORECARD_FIELDS[sport];
    if (!fields) { container.innerHTML = '<p class="label" style="color:var(--text-muted);padding:0.5rem 0;">Basic logging only for this sport.</p>'; return; }
    fields.forEach(f => {
        container.innerHTML += `<div><label class="label">${f.label}</label><input type="${f.type}" id="sc-${f.key}" class="input" min="${f.min || 0}" ${f.max ? 'max="'+f.max+'"' : ''} ${f.step ? 'step="'+f.step+'"' : ''} placeholder="0"></div>`;
    });
}

// --- Log Match ---
async function handleLogMatch(e) {
    e.preventDefault();
    const sport = document.getElementById('log-sport').value;
    const duration = parseInt(document.getElementById('log-duration').value);
    const effort = parseInt(document.getElementById('log-effort').value);
    const matchTitle = document.getElementById('log-title')?.value || '';
    const opponent = document.getElementById('log-opponent')?.value || '';
    const result = document.getElementById('log-result')?.value || '';
    const scoreOwn = parseInt(document.getElementById('log-score-own')?.value) || 0;
    const scoreOpp = parseInt(document.getElementById('log-score-opp')?.value) || 0;
    const location = document.getElementById('log-location')?.value || '';
    const notes = document.getElementById('log-notes')?.value || '';

    const body = { sport, duration, effort, matchTitle, opponent, result, score: { own: scoreOwn, opponent: scoreOpp }, location, notes };

    // Collect sport-specific stats
    const fields = SCORECARD_FIELDS[sport];
    if (fields) {
        const statsKey = sport + 'Stats';
        body[statsKey] = {};
        fields.forEach(f => {
            const el = document.getElementById('sc-' + f.key);
            if (el && el.value) body[statsKey][f.key] = parseFloat(el.value);
        });
    }

    try {
        const res = await fetch(`${API_URL}/user/log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': getToken() },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (res.ok) {
            showToast(`+${data.pointsEarned} Points Earned!`, 'success');
            document.getElementById('dash-score').innerText = data.efficiencyScore.toFixed(1);
            document.getElementById('dash-matches').innerText = data.totalMatchesLogged;
            if (data.newBadges && data.newBadges.length > 0) {
                data.newBadges.forEach(b => showToast(`🏆 Badge Earned: ${b.name}!`, 'success'));
            }
            e.target.reset();
            document.getElementById('scorecard-fields').innerHTML = '';
            onSportChange();
            fetchMatches();
            fetchStats();
        } else { showToast(data.message || 'Failed to log', 'error'); }
    } catch (err) { 
        console.error('Match Log Error:', err);
        showToast('Network error', 'error'); 
    }
}

// --- Fetch & Render Matches ---
async function fetchMatches(sport = 'all') {
    try {
        const url = sport === 'all' ? `${API_URL}/user/matches` : `${API_URL}/user/matches?sport=${sport}`;
        const res = await fetch(url, { headers: { 'x-auth-token': getToken() } });
        if (res.ok) {
            const matches = await res.json();
            renderChart(matches);
            renderMatchTable(matches);
        }
    } catch (err) { console.error('Failed to fetch matches', err); }
}

function renderChart(matches) {
    const ctx = document.getElementById('matchChart');
    const msg = document.getElementById('no-matches-msg');
    if (!matches || matches.length === 0) { msg?.classList.remove('hidden'); ctx?.classList.add('hidden'); return; }
    msg?.classList.add('hidden'); ctx?.classList.remove('hidden');
    const sorted = [...matches].reverse();
    const labels = sorted.map(m => new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    const dataPoints = sorted.map(m => m.pointsEarned);
    if (matchChartInstance) matchChartInstance.destroy();
    matchChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Points', data: dataPoints, borderColor: '#4edea3', backgroundColor: 'rgba(78,222,163,0.1)', tension: 0.3, fill: true, pointBackgroundColor: '#171f33', pointBorderColor: '#4edea3', pointHoverBackgroundColor: '#4edea3' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#738298' } }, x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#738298' } } } }
    });
}

function renderMatchTable(matches) {
    const tbody = document.getElementById('match-history-body');
    if (!tbody) return;
    if (!matches || matches.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem;">No matches logged yet.</td></tr>'; return; }
    tbody.innerHTML = matches.slice(0, 20).map((m, i) => {
        const date = new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
        const resultClass = m.result === 'win' ? 'result-win' : m.result === 'loss' ? 'result-loss' : m.result === 'draw' ? 'result-draw' : '';
        const resultText = m.result ? m.result.charAt(0).toUpperCase() + m.result.slice(1) : '-';
        const sportInfo = SPORT_OPTIONS.find(s => s.value === m.sport) || { label: m.sport, icon: 'sports' };
        const color = SPORT_COLORS[m.sport] || '#6b7280';
        return `<tr class="fade-in-up" style="animation-delay:${i * 0.03}s">
            <td>${date}</td>
            <td><span class="sport-tag" style="background:${color}22;color:${color};border:1px solid ${color}44;"><span class="material-symbols-outlined" style="font-size:14px;">${sportInfo.icon}</span>${sportInfo.label}</span></td>
            <td>${m.matchTitle || m.opponent || '-'}</td>
            <td class="${resultClass}" style="font-weight:700;">${resultText}</td>
            <td style="font-weight:700;color:var(--primary);">+${m.pointsEarned}</td>
            <td>${m.duration}m</td>
        </tr>`;
    }).join('');
}

// --- Stats / Analytics ---
async function fetchStats() {
    try {
        const res = await fetch(`${API_URL}/user/stats`, { headers: { 'x-auth-token': getToken() } });
        if (res.ok) {
            currentStats = await res.json();
            renderAnalytics(currentStats);
        }
    } catch (err) { console.error(err); }
}

function renderAnalytics(stats) {
    const o = stats.overview;
    const el = (id) => document.getElementById(id);
    if (el('stat-winrate')) el('stat-winrate').innerText = o.winRate + '%';
    if (el('stat-wins')) el('stat-wins').innerText = o.wins;
    if (el('stat-losses')) el('stat-losses').innerText = o.losses;
    if (el('stat-draws')) el('stat-draws').innerText = o.draws;
    if (el('stat-avg-effort')) el('stat-avg-effort').innerText = o.avgEffort;
    if (el('stat-avg-points')) el('stat-avg-points').innerText = o.avgPoints;
    if (el('stat-avg-duration')) el('stat-avg-duration').innerText = o.avgDuration + 'm';

    // Sport breakdown
    const breakdown = document.getElementById('sport-breakdown');
    if (breakdown) {
        const entries = Object.entries(stats.sportBreakdown);
        if (entries.length === 0) { breakdown.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Log matches to see sport breakdown.</p>'; return; }
        breakdown.innerHTML = entries.map(([sport, data]) => {
            const color = SPORT_COLORS[sport] || '#6b7280';
            const info = SPORT_OPTIONS.find(s => s.value === sport) || { label: sport, icon: 'sports' };
            return `<div class="card" style="padding:1rem;"><div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;"><span class="material-symbols-outlined" style="color:${color};">${info.icon}</span><span style="font-weight:700;">${info.label}</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;font-size:0.75rem;"><div><span style="color:var(--text-muted);">Matches:</span> <strong>${data.count}</strong></div><div><span style="color:var(--text-muted);">Points:</span> <strong style="color:var(--primary);">${data.totalPoints}</strong></div><div><span style="color:var(--text-muted);">Wins:</span> <strong class="result-win">${data.wins || 0}</strong></div><div><span style="color:var(--text-muted);">Best:</span> <strong>${data.bestScore || 0}</strong></div></div></div>`;
        }).join('');
    }
}

// --- Badges ---
function renderBadges(badges) {
    const container = document.getElementById('badges-container');
    if (!container) return;
    if (badges.length === 0) { container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Log matches to earn badges!</p>'; return; }
    container.innerHTML = badges.map(b => `<div class="badge-chip"><span class="material-symbols-outlined" style="font-size:16px;">${b.icon}</span>${b.name}</div>`).join('');
}

// --- Goals ---
function renderGoals(goals) {
    const container = document.getElementById('goals-container');
    if (!container) return;
    if (goals.length === 0) { container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Set a goal to track your progress!</p>'; return; }
    container.innerHTML = goals.map(g => {
        const pct = Math.min(100, (g.currentValue / g.targetValue) * 100).toFixed(0);
        return `<div style="margin-bottom:1rem;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem;"><span style="font-size:0.85rem;font-weight:700;">${g.title}</span><div style="display:flex;align-items:center;gap:0.5rem;"><span style="font-size:0.7rem;color:var(--text-muted);">${g.currentValue}/${g.targetValue} ${g.unit}</span>${g.completed ? '<span style="color:var(--primary);font-size:0.7rem;font-weight:700;">✓ DONE</span>' : ''}<button onclick="deleteGoal('${g._id}')" style="background:none;border:none;color:var(--error);cursor:pointer;font-size:0.8rem;">×</button></div></div><div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%;"></div></div></div>`;
    }).join('');
}

async function handleAddGoal(e) {
    e.preventDefault();
    const title = document.getElementById('goal-title').value;
    const targetValue = parseInt(document.getElementById('goal-target').value);
    const unit = document.getElementById('goal-unit').value;
    try {
        const res = await fetch(`${API_URL}/user/goals`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': getToken() },
            body: JSON.stringify({ title, targetValue, unit })
        });
        if (res.ok) { const goals = await res.json(); renderGoals(goals); e.target.reset(); showToast('Goal created!', 'success'); }
    } catch (err) { showToast('Failed to create goal', 'error'); }
}

async function deleteGoal(goalId) {
    try {
        const res = await fetch(`${API_URL}/user/goals/${goalId}`, { method: 'DELETE', headers: { 'x-auth-token': getToken() } });
        if (res.ok) { const goals = await res.json(); renderGoals(goals); }
    } catch (err) { showToast('Failed to delete goal', 'error'); }
}

// --- Team ---
async function fetchTeam() {
    try {
        const res = await fetch(`${API_URL}/teams/my`, { headers: { 'x-auth-token': getToken() } });
        if (res.ok) {
            const team = await res.json();
            renderTeam(team);
        }
    } catch (err) { console.error(err); }
}

function renderTeam(team) {
    const container = document.getElementById('team-container');
    if (!container) return;
    if (!team) {
        container.innerHTML = `<div style="text-align:center;padding:1rem;"><p style="color:var(--text-muted);margin-bottom:1rem;">You're not in a team yet.</p><div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;"><button onclick="document.getElementById('create-team-modal').classList.remove('hidden')" class="btn-premium" style="padding:0.5rem 1.25rem;background:var(--primary);color:#002113;font-weight:700;border-radius:9999px;border:1px solid var(--primary);font-size:0.8rem;">Create Team</button><button onclick="document.getElementById('join-team-modal').classList.remove('hidden')" style="padding:0.5rem 1.25rem;background:var(--surface-highest);color:var(--text);font-weight:700;border-radius:9999px;border:1px solid var(--border);font-size:0.8rem;cursor:pointer;">Join Team</button></div></div>`;
        return;
    }
    const members = team.members || [];
    container.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;"><div><h4 style="font-size:1.1rem;font-weight:800;">${team.name}</h4><span class="sport-tag" style="background:${SPORT_COLORS[team.sport]}22;color:${SPORT_COLORS[team.sport]};border:1px solid ${SPORT_COLORS[team.sport]}44;margin-top:0.25rem;">${team.sport}</span></div><div style="text-align:right;"><div style="font-size:0.6rem;color:var(--text-muted);font-weight:700;">INVITE CODE</div><div style="font-size:0.9rem;font-weight:800;color:var(--primary);letter-spacing:2px;">${team.inviteCode}</div></div></div><div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.5rem;">MEMBERS (${members.length})</div>${members.map(m => `<div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border);font-size:0.85rem;"><span>${m.name}${team.captain && (team.captain._id === m._id || team.captain.name === m.name) ? ' 👑' : ''}</span><span style="color:var(--primary);font-weight:700;">${(m.efficiencyScore || 0).toFixed(1)}</span></div>`).join('')}<button onclick="leaveTeam()" style="margin-top:1rem;width:100%;padding:0.5rem;background:transparent;border:1px solid var(--error);color:var(--error);border-radius:0.5rem;cursor:pointer;font-weight:700;font-size:0.8rem;">Leave Team</button>`;
}

async function handleCreateTeam(e) {
    e.preventDefault();
    const name = document.getElementById('team-name').value;
    const sport = document.getElementById('team-sport').value;
    try {
        const res = await fetch(`${API_URL}/teams`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': getToken() }, body: JSON.stringify({ name, sport }) });
        const data = await res.json();
        if (res.ok) { showToast('Team created!', 'success'); document.getElementById('create-team-modal').classList.add('hidden'); fetchTeam(); }
        else showToast(data.message, 'error');
    } catch (err) { showToast('Network error', 'error'); }
}

async function handleJoinTeam(e) {
    e.preventDefault();
    const inviteCode = document.getElementById('join-code').value;
    try {
        const res = await fetch(`${API_URL}/teams/join`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': getToken() }, body: JSON.stringify({ inviteCode }) });
        const data = await res.json();
        if (res.ok) { showToast('Joined team!', 'success'); document.getElementById('join-team-modal').classList.add('hidden'); fetchTeam(); }
        else showToast(data.message, 'error');
    } catch (err) { showToast('Network error', 'error'); }
}

async function leaveTeam() {
    if (!confirm('Are you sure you want to leave your team?')) return;
    try {
        const res = await fetch(`${API_URL}/teams/leave`, { method: 'POST', headers: { 'x-auth-token': getToken() } });
        if (res.ok) { showToast('Left team', 'info'); fetchTeam(); }
    } catch (err) { showToast('Error', 'error'); }
}

// --- Settings ---
function openSettingsModal() { document.getElementById('settings-modal').classList.remove('hidden'); document.getElementById('settings-name').value = document.getElementById('user-display-name').innerText; }
function closeSettingsModal() { document.getElementById('settings-modal').classList.add('hidden'); }

async function handleUpdateProfile(e) {
    e.preventDefault();
    const name = document.getElementById('settings-name').value;
    const bio = document.getElementById('settings-bio')?.value || '';
    try {
        const res = await fetch(`${API_URL}/user/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-auth-token': getToken() }, body: JSON.stringify({ name, bio }) });
        if (res.ok) { const user = await res.json(); document.getElementById('user-display-name').innerText = user.name; showToast('Profile updated!', 'success'); setTimeout(closeSettingsModal, 1000); }
    } catch (err) { showToast('Failed to update', 'error'); }
}

async function handleChangePassword(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    try {
        const res = await fetch(`${API_URL}/user/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-auth-token': getToken() }, body: JSON.stringify({ currentPassword, newPassword }) });
        const data = await res.json();
        if (res.ok) { showToast('Password changed!', 'success'); e.target.reset(); }
        else showToast(data.message, 'error');
    } catch (err) { showToast('Network error', 'error'); }
}

async function handleDeleteAccount() {
    if (!confirm('This will permanently delete your account and all data. Are you sure?')) return;
    if (!confirm('Last chance! This cannot be undone.')) return;
    try {
        const res = await fetch(`${API_URL}/user/account`, { method: 'DELETE', headers: { 'x-auth-token': getToken() } });
        if (res.ok) { showToast('Account deleted', 'info'); setTimeout(logout, 1500); }
    } catch (err) { showToast('Error', 'error'); }
}

// --- Pro Search (TheSportsDB) ---
let debounceTimer;
function initProSearch() {
    const searchInput = document.getElementById('search-query');
    const searchDropdown = document.getElementById('search-dropdown');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        if (query.length < 2) { searchDropdown.innerHTML = ''; searchDropdown.classList.add('hidden'); return; }
        debounceTimer = setTimeout(async () => {
            try {
                const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(query)}`);
                const data = await res.json();
                searchDropdown.innerHTML = '';
                if (data.player && data.player.length > 0) {
                    data.player.slice(0, 5).forEach(p => {
                        const li = document.createElement('li');
                        li.style.cssText = 'padding:0.75rem 1rem;cursor:pointer;display:flex;align-items:center;gap:0.75rem;border-bottom:1px solid var(--border);transition:background 0.2s;';
                        li.onmouseenter = () => li.style.background = 'var(--surface-highest)';
                        li.onmouseleave = () => li.style.background = 'transparent';
                        const thumb = p.strThumb || p.strCutout || '';
                        li.innerHTML = `<div style="width:40px;height:40px;border-radius:50%;overflow:hidden;background:var(--bg);border:1px solid var(--border);flex-shrink:0;">${thumb ? `<img src="${thumb}" style="width:100%;height:100%;object-fit:cover;">` : '<span class="material-symbols-outlined" style="font-size:24px;display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);">person</span>'}</div><div><div style="font-size:0.85rem;font-weight:700;">${p.strPlayer}</div><div style="font-size:0.7rem;color:var(--text-muted);">${p.strSport || '?'} • ${p.strTeam || '?'}</div></div>`;
                        li.onclick = () => { searchInput.value = p.strPlayer; searchDropdown.classList.add('hidden'); handleProSearch(null, p.strPlayer); };
                        searchDropdown.appendChild(li);
                    });
                    searchDropdown.classList.remove('hidden');
                } else { searchDropdown.innerHTML = '<li style="padding:0.75rem;text-align:center;color:var(--text-muted);font-size:0.85rem;">No results</li>'; searchDropdown.classList.remove('hidden'); }
            } catch (err) { console.error(err); }
        }, 300);
    });
    document.addEventListener('click', (e) => { if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) searchDropdown.classList.add('hidden'); });
}

async function handleProSearch(e, queryOverride) {
    if (e) e.preventDefault();
    const query = queryOverride || document.getElementById('search-query').value;
    document.getElementById('pro-empty').classList.add('hidden');
    document.getElementById('pro-results').classList.add('hidden');
    document.getElementById('pro-loading').classList.remove('hidden');
    try {
        const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(query)}`);
        const data = await res.json();
        document.getElementById('pro-loading').classList.add('hidden');
        if (data.player && data.player.length > 0) {
            const p = data.player[0];
            document.getElementById('pro-name').innerText = p.strPlayer || 'Unknown';
            document.getElementById('pro-team').innerText = p.strTeam || 'Independent';
            document.getElementById('pro-sport').innerText = p.strSport || 'SPORT';
            const grid = document.getElementById('pro-stats-grid');
            grid.innerHTML = '';
            [{icon:'flag',label:'Nationality',value:p.strNationality},{icon:'calendar_month',label:'Born',value:p.dateBorn},{icon:'sports_gymnastics',label:'Position',value:p.strPosition},{icon:'vital_signs',label:'Status',value:p.strStatus}].forEach(s => {
                if (s.value) grid.innerHTML += `<div style="display:flex;align-items:center;gap:0.5rem;background:var(--surface-highest);padding:0.5rem 0.75rem;border-radius:0.5rem;border:1px solid var(--border);"><span class="material-symbols-outlined" style="color:var(--primary);font-size:16px;">${s.icon}</span><div><div style="font-size:0.55rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">${s.label}</div><div style="font-size:0.85rem;font-weight:700;">${s.value}</div></div></div>`;
            });
            const imgEl = document.getElementById('pro-img');
            const ph = document.getElementById('pro-img-placeholder');
            if (p.strThumb || p.strRender) { imgEl.src = p.strRender || p.strThumb; imgEl.classList.remove('hidden'); ph.classList.add('hidden'); }
            else { imgEl.classList.add('hidden'); ph.classList.remove('hidden'); }
            document.getElementById('pro-results').classList.remove('hidden');
        } else {
            document.getElementById('pro-empty').innerHTML = '<span class="material-symbols-outlined" style="font-size:3rem;color:var(--error);">person_off</span><p style="color:var(--error);font-weight:700;margin-top:0.5rem;">Athlete not found.</p>';
            document.getElementById('pro-empty').classList.remove('hidden');
        }
    } catch (err) {
        document.getElementById('pro-loading').classList.add('hidden');
        document.getElementById('pro-empty').innerHTML = '<span class="material-symbols-outlined" style="font-size:3rem;color:var(--error);">error</span><p style="color:var(--error);">Network error</p>';
        document.getElementById('pro-empty').classList.remove('hidden');
    }
}

// --- Match Filter ---
function filterMatches() {
    const sport = document.getElementById('match-filter-sport')?.value || 'all';
    fetchMatches(sport);
}

// --- HEAD-TO-HEAD COMPARE ---
let compareDebounce;
function initCompareSearch() {
    const input = document.getElementById('compare-search');
    const dropdown = document.getElementById('compare-dropdown');
    if (!input) return;

    input.addEventListener('input', (e) => {
        clearTimeout(compareDebounce);
        const q = e.target.value.trim();
        if (q.length < 2) { dropdown.innerHTML = ''; dropdown.classList.add('hidden'); return; }
        compareDebounce = setTimeout(async () => {
            try {
                const res = await fetch(`${API_URL}/public/search?q=${encodeURIComponent(q)}`);
                const users = await res.json();
                dropdown.innerHTML = '';
                if (users.length > 0) {
                    users.forEach(u => {
                        const li = document.createElement('li');
                        li.style.cssText = 'padding:0.6rem 1rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);transition:background 0.2s;font-size:0.85rem;';
                        li.onmouseenter = () => li.style.background = 'var(--surface-highest)';
                        li.onmouseleave = () => li.style.background = 'transparent';
                        li.innerHTML = `<span style="font-weight:700;">${u.name}</span><span style="color:var(--primary);font-weight:700;">${(u.efficiencyScore||0).toFixed(1)} pts</span>`;
                        li.onclick = () => { dropdown.classList.add('hidden'); input.value = u.name; loadCompare(u._id); };
                        dropdown.appendChild(li);
                    });
                    dropdown.classList.remove('hidden');
                } else { dropdown.innerHTML = '<li style="padding:0.6rem;text-align:center;color:var(--text-muted);font-size:0.8rem;">No athletes found</li>'; dropdown.classList.remove('hidden'); }
            } catch (err) { console.error(err); }
        }, 300);
    });
    document.addEventListener('click', (e) => { if (!input.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.add('hidden'); });
}

async function loadCompare(userId) {
    const container = document.getElementById('compare-result');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:2rem;"><span class="material-symbols-outlined" style="font-size:2rem;color:var(--primary);animation:loaderSpin 0.8s linear infinite;">refresh</span></div>';
    try {
        const res = await fetch(`${API_URL}/user/compare/${userId}`, { headers: { 'x-auth-token': getToken() } });
        if (!res.ok) { container.innerHTML = '<p style="color:var(--error);text-align:center;">Could not load comparison.</p>'; return; }
        const { me, them } = await res.json();
        renderCompare(me, them);
    } catch (err) { container.innerHTML = '<p style="color:var(--error);text-align:center;">Network error.</p>'; }
}

function renderCompare(me, them) {
    const container = document.getElementById('compare-result');
    const metrics = [
        { label: 'Efficiency Score', meVal: me.efficiencyScore, themVal: them.efficiencyScore },
        { label: 'Total Matches', meVal: me.totalMatches, themVal: them.totalMatches },
        { label: 'Win Rate', meVal: me.winRate, themVal: them.winRate, suffix: '%' },
        { label: 'Wins', meVal: me.wins, themVal: them.wins },
        { label: 'Avg Points/Match', meVal: me.avgPoints, themVal: them.avgPoints },
        { label: 'Best Match', meVal: me.bestMatch, themVal: them.bestMatch },
        { label: 'Badges', meVal: me.badges, themVal: them.badges },
        { label: 'Sports Played', meVal: me.sports.length, themVal: them.sports.length },
    ];

    let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;padding:0 0.5rem;">
        <div style="text-align:left;"><div style="font-size:1.2rem;font-weight:800;color:var(--primary);">${me.name}</div><div style="font-size:0.7rem;color:var(--text-muted);">YOU</div></div>
        <span class="material-symbols-outlined" style="font-size:2rem;color:var(--text-muted);">compare_arrows</span>
        <div style="text-align:right;"><div style="font-size:1.2rem;font-weight:800;color:var(--secondary);">${them.name}</div><div style="font-size:0.7rem;color:var(--text-muted);">OPPONENT</div></div>
    </div>`;

    metrics.forEach(m => {
        const max = Math.max(m.meVal, m.themVal, 1);
        const mePct = (m.meVal / max * 100).toFixed(0);
        const themPct = (m.themVal / max * 100).toFixed(0);
        const meWin = m.meVal > m.themVal;
        const suffix = m.suffix || '';
        html += `<div style="margin-bottom:0.75rem;">
            <div style="font-size:0.65rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.35rem;text-align:center;">${m.label}</div>
            <div style="display:flex;gap:0.5rem;align-items:center;">
                <span style="width:60px;text-align:right;font-weight:800;font-size:0.85rem;color:${meWin ? 'var(--primary)' : 'var(--text-muted)'};">${m.meVal}${suffix}</span>
                <div style="flex:1;display:flex;gap:2px;">
                    <div style="flex:1;display:flex;justify-content:flex-end;"><div style="height:8px;width:${mePct}%;background:var(--primary);border-radius:4px 0 0 4px;transition:width 0.6s;"></div></div>
                    <div style="flex:1;"><div style="height:8px;width:${themPct}%;background:var(--secondary);border-radius:0 4px 4px 0;transition:width 0.6s;"></div></div>
                </div>
                <span style="width:60px;font-weight:800;font-size:0.85rem;color:${!meWin ? 'var(--secondary)' : 'var(--text-muted)'};">${m.themVal}${suffix}</span>
            </div>
        </div>`;
    });

    // View their profile link
    html += `<div style="text-align:center;margin-top:1rem;"><a href="profile.html?id=${them.id}" style="color:var(--secondary);font-size:0.8rem;font-weight:700;text-decoration:none;">View ${them.name}'s Public Profile →</a></div>`;
    container.innerHTML = html;
}

// --- SOCIAL SHARING (Stats Card) ---
function generateShareCard() {
    if (!currentStats) { showToast('Load your stats first!', 'info'); return; }
    const canvas = document.getElementById('shareCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const o = currentStats.overview;
    const user = { name: document.getElementById('user-display-name').innerText, score: o.efficiencyScore, matches: o.totalMatches, winRate: o.winRate, wins: o.wins, badges: currentStats.badges?.length || 0 };

    // Background
    const grad = ctx.createLinearGradient(0, 0, 600, 400);
    grad.addColorStop(0, '#0b1326'); grad.addColorStop(1, '#171f33');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 600, 400);

    // Top accent
    const accent = ctx.createLinearGradient(0, 0, 600, 0);
    accent.addColorStop(0, '#4edea3'); accent.addColorStop(1, '#4cd7f6');
    ctx.fillStyle = accent; ctx.fillRect(0, 0, 600, 5);

    // Brand
    ctx.fillStyle = '#4edea3'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('SPORTLYTICS', 30, 40);
    ctx.fillStyle = '#738298'; ctx.font = '10px sans-serif'; ctx.fillText('ATHLETE PERFORMANCE CARD', 30, 55);

    // Name
    ctx.fillStyle = '#dae2fd'; ctx.font = 'bold 32px sans-serif'; ctx.fillText(user.name, 30, 110);

    // Stats boxes
    const stats = [
        { label: 'SCORE', value: user.score.toFixed(1) },
        { label: 'MATCHES', value: String(user.matches) },
        { label: 'WIN RATE', value: user.winRate + '%' },
        { label: 'BADGES', value: String(user.badges) }
    ];
    stats.forEach((s, i) => {
        const x = 30 + i * 140; const y = 150;
        ctx.fillStyle = '#060e20'; ctx.beginPath(); ctx.roundRect(x, y, 120, 70, 10); ctx.fill();
        ctx.strokeStyle = 'rgba(78,222,163,0.2)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x, y, 120, 70, 10); ctx.stroke();
        ctx.fillStyle = '#4edea3'; ctx.font = 'bold 24px sans-serif'; ctx.fillText(s.value, x + 15, y + 35);
        ctx.fillStyle = '#738298'; ctx.font = 'bold 9px sans-serif'; ctx.fillText(s.label, x + 15, y + 55);
    });

    // Sport breakdown
    ctx.fillStyle = '#738298'; ctx.font = 'bold 10px sans-serif'; ctx.fillText('SPORT BREAKDOWN', 30, 270);
    let sx = 30;
    Object.entries(currentStats.sportBreakdown || {}).forEach(([sport, data]) => {
        const info = SPORT_OPTIONS.find(o => o.value === sport) || { label: sport };
        const label = `${info.label}: ${data.count} matches`;
        const w = ctx.measureText(label).width + 24;
        ctx.fillStyle = 'rgba(78,222,163,0.12)'; ctx.beginPath(); ctx.roundRect(sx, 280, w, 26, 13); ctx.fill();
        ctx.fillStyle = '#4edea3'; ctx.font = 'bold 10px sans-serif'; ctx.fillText(label, sx + 12, 297);
        sx += w + 10;
    });

    // Footer
    ctx.fillStyle = '#738298'; ctx.font = '9px sans-serif'; ctx.fillText('sportlytics.app • Generated ' + new Date().toLocaleDateString(), 30, 390);

    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `${user.name.replace(/\s+/g, '_')}_sportlytics_card.png`; a.click();
        URL.revokeObjectURL(url);
        showToast('Stats card downloaded! Share it anywhere 🚀', 'success');
    });
}

// --- Init on Load ---
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initDashboard();
    initProSearch();
    initCompareSearch();
});
