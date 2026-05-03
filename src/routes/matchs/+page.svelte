<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
	interface Noms {
		nom_equipe1: string,
		nom_equipe2: string,
		prenom_t1_p1: string,
		prenom_t1_p2: string,
		prenom_t2_p1: string,
		prenom_t2_p2: string,
	};
	
	interface Historique {
		nom_equipe1: string,
		nom_equipe2: string,
		victoire: boolean,
	};

	let equipe = $derived(data.equipe);
	let match = $derived(data.match);
	let noms = $derived(data.noms) as Noms | null;
	let historique = $derived(data.historique || []) as Historique[];
	let isInQueue = $derived(data.matchmaking);
	let isAdmin = $derived(data.user?.role === 'cercleux');
	
	// Calcul des stats à la volée
	let stats = $derived({
		victoires: historique.filter(m => m.victoire).length,
		defaites: historique.filter(m => !m.victoire).length,
		get total() { return this.victoires + this.defaites },
		get winrate() { 
			return this.total > 0 ? Math.round((this.victoires / this.total) * 100) : 0 
		}
	});
</script>

<div class="container">
	<div class="match-header">
		<h1>PECK 2V2</h1>
		<div class="status-indicator">
			{#if match}
				<span class="dot live"></span> EN MATCH
			{:else if isInQueue}
				<span class="dot waiting"></span> EN RECHERCHE
			{:else}
				<span class="dot idle"></span> DISPONIBLE
			{/if}
		</div>
	</div>

	{#if form?.error}
		<div class="alert error">
			<p>{form.error}</p>
		</div>
	{/if}

	<div class="dashboard-grid">
		
		<div class="main-card">
			{#if match}
				<div class="match-vs">
					<div class="team">
						<span class="team-label">ÉQUIPE 1</span>
						<span class="team-name">{noms.nom_equipe1}</span>
					</div>
					<div class="vs-divider">
						<div class="line"></div>
						<span>VS</span>
						<div class="line"></div>
					</div>
					<div class="team">
						<span class="team-label">ÉQUIPE 2</span>
						<span class="team-name">{noms.nom_equipe2}</span>
					</div>
				</div>

				<div class="admin-panel">
					<p class="panel-title">CONTRÔLE DU CERCLE</p>
					<div class="winner-buttons">
						<form method="POST" action="?/terminerMatch" use:enhance>
							<input type="hidden" name="id_match" value={match.id} />
							<input type="hidden" name="id_equipe_gagnante" value={match.id_equipe1} />
							<button class="btn btn-win">Victoire {noms.nom_equipe1}</button>
						</form>
						<form method="POST" action="?/terminerMatch" use:enhance>
							<input type="hidden" name="id_match" value={match.id} />
							<input type="hidden" name="id_equipe_gagnante" value={match.id_equipe2} />
							<button class="btn btn-win">Victoire {noms.nom_equipe2}</button>
						</form>
					</div>
					<form method="POST" action="?/annulerMatch" use:enhance>
						<input type="hidden" name="id_match" value={match.id} />
						<button class="btn-text">Annuler le match</button>
					</form>
				</div>

			{:else if isInQueue}
				<div class="queue-status">
					<div class="scanner"></div>
					<h3>DANS LA FILE D'ATTENTE</h3>
					<p>Équipe : {equipe.nom}</p>
					<form method="POST" action="?/quitterQueue" use:enhance>
						<input type="hidden" name="id_equipe" value={equipe.id} />
						<button class="btn btn-danger">QUITTER LA QUEUE</button>
					</form>
				</div>

			{:else}
				<div class="join-status">
					<h3>PRÊT POUR LE PROCHAIN ROUND ?</h3>
					<form method="POST" action="?/rejoindreQueue" use:enhance>
						<input type="hidden" name="id_equipe" value={equipe.id} />
						<button class="btn btn-primary">REJOINDRE LA QUEUE</button>
					</form>
				</div>
			{/if}
		</div>

		<aside class="side-info">
			<div class="info-block">
				<span class="label">VOTRE ÉQUIPE</span>
				<p class="value">{equipe?.nom || 'Non inscrit'}</p>
			</div>
			<div class="info-block">
				<span class="label">RÔLE</span>
				<p class="value {isAdmin ? 'gold' : ''}">{isAdmin ? 'Cercleux' : 'Joueur'}</p>
			</div>
		</aside>
	</div>

	<section class="history-section">
		<div class="stats-bar">
			<div class="stat-item">
				<span class="stat-value">{stats.victoires}</span>
				<span class="stat-label">Victoires</span>
			</div>
			<div class="stat-item">
				<span class="stat-value">{stats.defaites}</span>
				<span class="stat-label">Défaites</span>
			</div>
			<div class="stat-item highlight">
				<span class="stat-value">{stats.winrate}%</span>
				<span class="stat-label">Win Rate</span>
			</div>
		</div>
	
		<div class="history-list">
			<h2>Derniers affrontements</h2>
			{#if historique.length === 0}
				<p class="empty-msg">Aucun match enregistré pour le moment.</p>
			{:else}
				<div class="scroll-container">
					{#each historique as match}
						<div class="history-card {match.victoire ? 'win' : 'loss'}">
							<div class="match-info">
								<span class="opponent">
									{match.nom_equipe1 === equipe.nom ? match.nom_equipe2 : match.nom_equipe1}
								</span>
								<span class="match-type">2v2 Arena</span>
							</div>
							<div class="match-result">
								{match.victoire ? 'VICTOIRE' : 'DÉFAITE'}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</div>

<style>
	.container {
		max-width: 900px;
		margin: 2rem auto;
		padding: 0 1rem;
		color: var(--text-color, #eee);
	}

	.match-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		border-bottom: 2px solid rgba(255,255,255,0.1);
		padding-bottom: 1rem;
		margin-bottom: 2rem;
	}

	h1 {
		margin: 0;
		font-size: 2.5rem;
		letter-spacing: -1px;
		font-weight: 800;
		font-style: italic;
	}

	.status-indicator {
		font-size: 0.8rem;
		font-weight: bold;
		letter-spacing: 1px;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}
	.live { background: #ff4757; box-shadow: 0 0 10px #ff4757; }
	.waiting { background: #ffa502; box-shadow: 0 0 10px #ffa502; }
	.idle { background: #2f3542; }

	.dashboard-grid {
		display: grid;
		grid-template-columns: 1fr 250px;
		gap: 1.5rem;
	}

	.main-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 2.5rem;
		backdrop-filter: blur(10px);
	}

	/* Match VS Display */
	.match-vs {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.team {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
	}

	.team-label { font-size: 0.7rem; opacity: 0.5; margin-bottom: 0.5rem; }
	.team-name { font-size: 1.5rem; font-weight: 800; text-transform: uppercase; }

	.vs-divider {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0 2rem;
		opacity: 0.3;
	}
	.vs-divider .line { width: 1px; height: 30px; background: white; }
	.vs-divider span { font-weight: 900; padding: 0.5rem 0; }

	/* Buttons */
	.btn {
		width: 100%;
		padding: 1rem;
		border: none;
		border-radius: 6px;
		font-weight: 900;
		text-transform: uppercase;
		cursor: pointer;
		transition: transform 0.1s, filter 0.2s;
	}

	.btn:active { transform: scale(0.98); }

	.btn-primary { background: #fff; color: #000; }
	.btn-danger { background: transparent; border: 1px solid #ff4757; color: #ff4757; }
	.btn-win { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); color: white; margin-top: 0.5rem;}
	.btn-win:hover { background: rgba(255,255,255,0.1); border-color: #2ed573; color: #2ed573;}

	.btn-text {
		background: none;
		border: none;
		color: rgba(255,255,255,0.3);
		text-decoration: underline;
		font-size: 0.8rem;
		margin-top: 1rem;
		cursor: pointer;
	}

	/* Sidebar */
	.side-info {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.info-block {
		background: rgba(255,255,255,0.02);
		padding: 1rem;
		border-left: 3px solid rgba(255,255,255,0.1);
	}

	.label { font-size: 0.65rem; opacity: 0.5; font-weight: bold; }
	.value { font-size: 1.1rem; font-weight: bold; margin-top: 0.2rem; }
	.gold { color: #f1c40f; }

	/* Queue Animation */
	.queue-status {
		position: relative;
		overflow: hidden;
	}

	.scanner {
		width: 100%;
		height: 2px;
		background: #ffa502;
		position: absolute;
		top: 0;
		left: 0;
		animation: scan 2s linear infinite;
		box-shadow: 0 0 15px #ffa502;
	}

	@keyframes scan {
		0% { top: 0; }
		50% { top: 100%; }
		100% { top: 0; }
	}

	.alert.error {
		background: rgba(255, 71, 87, 0.1);
		border-left: 4px solid #ff4757;
		padding: 0.5rem 1rem;
		margin-bottom: 1rem;
		color: #ff4757;
	}

	@media (max-width: 768px) {
		.dashboard-grid { grid-template-columns: 1fr; }
		h1 { font-size: 1.8rem; }
	}
	
	.history-section {
		margin-top: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Stats Bar */
	.stats-bar {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.stat-item {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.05);
		padding: 1rem;
		text-align: center;
		border-radius: 8px;
	}

	.stat-value {
		display: block;
		font-size: 1.5rem;
		font-weight: 800;
		font-style: italic;
	}

	.stat-label {
		font-size: 0.6rem;
		text-transform: uppercase;
		opacity: 0.5;
		letter-spacing: 1px;
	}

	.stat-item.highlight .stat-value {
		color: #f1c40f; /* Or pour le winrate */
	}

	/* History List */
	.history-list h2 {
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 2px;
		margin-bottom: 1rem;
		opacity: 0.8;
	}

	.scroll-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 400px;
		overflow-y: auto;
		padding-right: 0.5rem;
	}

	.history-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.8rem 1.2rem;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.03);
		border-left: 4px solid #333;
		transition: transform 0.2s;
	}

	.history-card:hover {
		transform: translateX(5px);
		background: rgba(255, 255, 255, 0.05);
	}

	.history-card.win { border-left-color: #2ed573; }
	.history-card.loss { border-left-color: #ff4757; }

	.opponent {
		display: block;
		font-weight: bold;
		text-transform: uppercase;
		font-size: 0.9rem;
	}

	.match-type {
		font-size: 0.7rem;
		opacity: 0.4;
	}

	.match-result {
		font-size: 0.75rem;
		font-weight: 900;
		letter-spacing: 1px;
	}

	.win .match-result { color: #2ed573; }
	.loss .match-result { color: #ff4757; }

	.empty-msg {
		font-size: 0.8rem;
		opacity: 0.3;
		font-style: italic;
	}

	/* Scrollbar personnalisée */
	.scroll-container::-webkit-scrollbar { width: 4px; }
	.scroll-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
</style>