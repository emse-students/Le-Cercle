<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	function formatDate(ts: number) {
		return new Date(ts * 1000).toLocaleString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDuree(debut: number) {
		const diff = Math.floor(Date.now() / 1000) - debut;
		const min = Math.floor(diff / 60);
		return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${min % 60}`;
	}
</script>

<div class="page">
	<h1>Matchs 2v2</h1>

	<!-- Erreur globale -->
	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}

	<!-- MES ÉQUIPES -->
	{#if data.mesEquipes.length > 0}
		<section>
			<h2>Mes équipes</h2>
			<div class="cards">
				{#each data.mesEquipes as equipe}
					<div class="card">
						<strong>{equipe.nom}</strong>
						<span class="members">
							{equipe.membres.map((m) => m.prenom).join(' & ')}
						</span>

						{#if equipe.enMatch}
							<span class="badge orange">En match</span>
						{:else if equipe.enQueue}
							<span class="badge blue">En attente…</span>
							<form method="POST" action="?/quitterQueue" use:enhance>
								<input type="hidden" name="id_equipe" value={equipe.id} />
								<button type="submit" class="btn-small danger">Quitter la file</button>
							</form>
						{:else}
							<form method="POST" action="?/rejoindreQueue" use:enhance>
								<input type="hidden" name="id_equipe" value={equipe.id} />
								<button type="submit" class="btn-small">Chercher un match</button>
							</form>
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- FILE D'ATTENTE -->
	<section>
		<h2>File d'attente ({data.queue.length})</h2>
		{#if data.queue.length === 0}
			<p class="empty">Aucune équipe en attente.</p>
		{:else}
			<table>
				<thead>
					<tr>
						<th>Équipe</th>
						<th>Joueurs</th>
						<th>Depuis</th>
					</tr>
				</thead>
				<tbody>
					{#each data.queue as entry}
						<tr>
							<td>{entry.equipe.nom}</td>
							<td>{entry.equipe.membres.map((m) => `${m.prenom} ${m.nom}`).join(' & ')}</td>
							<td>{formatDate(entry.date_inscription)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>

	<!-- MATCHS EN COURS -->
	<section>
		<h2>Matchs en cours ({data.matchsEnCours.length})</h2>
		{#if data.matchsEnCours.length === 0}
			<p class="empty">Aucun match en cours.</p>
		{:else}
			<div class="cards">
				{#each data.matchsEnCours as match}
					<div class="card match">
						<div class="versus">
							<div class="team">
								<strong>{match.equipe1.nom}</strong>
								<small>{match.equipe1.membres.map((m) => m.prenom).join(' & ')}</small>
							</div>
							<span class="vs">VS</span>
							<div class="team">
								<strong>{match.equipe2.nom}</strong>
								<small>{match.equipe2.membres.map((m) => m.prenom).join(' & ')}</small>
							</div>
						</div>
						<small class="muted">Depuis {formatDuree(match.date_debut)}</small>

						<!-- Actions cercleux uniquement -->
						<!-- @todo: passer isCercleux via data.user si besoin -->
						<div class="actions">
							<form method="POST" action="?/terminerMatch" use:enhance>
								<input type="hidden" name="id_match" value={match.id} />
								<input type="hidden" name="id_equipe_gagnante" value={match.id_equipe1} />
								<button type="submit" class="btn-small">🏆 {match.equipe1.nom}</button>
							</form>
							<form method="POST" action="?/terminerMatch" use:enhance>
								<input type="hidden" name="id_match" value={match.id} />
								<input type="hidden" name="id_equipe_gagnante" value={match.id_equipe2} />
								<button type="submit" class="btn-small">🏆 {match.equipe2.nom}</button>
							</form>
							<form method="POST" action="?/annulerMatch" use:enhance>
								<input type="hidden" name="id_match" value={match.id} />
								<button type="submit" class="btn-small danger">Annuler</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- HISTORIQUE -->
	<section>
		<h2>Derniers matchs</h2>
		{#if data.historique.length === 0}
			<p class="empty">Aucun match terminé.</p>
		{:else}
			<table>
				<thead>
					<tr>
						<th>Équipe 1</th>
						<th>Équipe 2</th>
						<th>Gagnant</th>
						<th>Date</th>
					</tr>
				</thead>
				<tbody>
					{#each data.historique as match}
						<tr>
							<td class:winner={match.id_equipe_gagnante === match.id_equipe1}>
								{match.equipe1.nom}
							</td>
							<td class:winner={match.id_equipe_gagnante === match.id_equipe2}>
								{match.equipe2.nom}
							</td>
							<td>{match.equipe_gagnante?.nom ?? '—'}</td>
							<td>{match.date_fin ? formatDate(match.date_fin) : '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>
</div>

<style>
	.page {
		max-width: 800px;
		margin: 0 auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	h1 {
		margin: 0;
	}

	h2 {
		margin: 0 0 0.75rem;
		font-size: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.6;
	}

	/* Cards */
	.cards {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.card {
		border: 1px solid #ddd;
		border-radius: 6px;
		padding: 0.75rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		min-width: 200px;
	}

	.card.match {
		flex: 1;
		min-width: 280px;
	}

	.members {
		font-size: 0.85rem;
		opacity: 0.7;
	}

	/* Versus layout */
	.versus {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.team {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.vs {
		font-weight: bold;
		font-size: 0.85rem;
		opacity: 0.4;
	}

	/* Badges */
	.badge {
		display: inline-block;
		font-size: 0.75rem;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		font-weight: 600;
		width: fit-content;
	}

	.badge.blue {
		background: #dbeafe;
		color: #1d4ed8;
	}

	.badge.orange {
		background: #ffedd5;
		color: #c2410c;
	}

	/* Actions */
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 0.25rem;
	}

	/* Buttons */
	.btn-small {
		padding: 0.25rem 0.6rem;
		font-size: 0.8rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: white;
		cursor: pointer;
	}

	.btn-small:hover {
		background: #f3f4f6;
	}

	.btn-small.danger {
		border-color: #fca5a5;
		color: #dc2626;
	}

	.btn-small.danger:hover {
		background: #fef2f2;
	}

	/* Table */
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	th,
	td {
		text-align: left;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid #eee;
	}

	th {
		font-weight: 600;
		opacity: 0.6;
		font-size: 0.8rem;
		text-transform: uppercase;
	}

	td.winner {
		font-weight: 700;
	}

	/* Misc */
	.empty {
		opacity: 0.5;
		font-size: 0.9rem;
	}

	.muted {
		opacity: 0.5;
		font-size: 0.8rem;
	}

	.error {
		color: #dc2626;
		background: #fef2f2;
		border: 1px solid #fca5a5;
		padding: 0.5rem 0.75rem;
		border-radius: 4px;
		font-size: 0.9rem;
	}
</style>
