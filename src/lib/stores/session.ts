import { writable } from 'svelte/store';

export interface Company {
	name: string;
	description: string;
	url: string;
}

export interface Topic {
	id: string;
	topic: string;
	suggestions: string;
}

export interface Prompt {
	id: string;
	prompt: string;
	tag: string;
	topicId: string;
}

export type ModelChoice = 'gpt-5-nano' | 'gpt-5-mini' | 'gpt-5';
export type LevelChoice = 'low' | 'medium' | 'high';

export interface LLMSettings {
	model: ModelChoice;
	reasoning: LevelChoice;
	verbosity: LevelChoice;
	searchContextSize: LevelChoice;
}

export interface SessionState {
	company: Company | null;
	topics: Topic[];
	prompts: Prompt[];
	// Editable system prompts
	companyPrompt: string;
	topicsPrompt: string;
	brandDiscoveryPrompt: string;
	organicMentionPrompt: string;
	// LLM settings
	llmSettings: LLMSettings;
}

const defaultCompanyPrompt = `# Objectif
Analyser le site fourni pour extraire les informations de l'entreprise.

# Contraintes
- \`description\` doit être concise (petit résumé intelligent de quelques phrases) et en français.

# Format de sortie
Retourner uniquement un JSON { "name": "...", "description": "..." }.`;

const defaultTopicsPrompt = `# Objectif
Générer {count} topics (champs sémantiques) stratégiques, classés par importance décroissante.

# Qu'est-ce qu'un bon topic ?
- CONCRET : Nomme un PRODUIT, SERVICE ou TECHNOLOGIE spécifique (ex: 'iPhone' plutôt que 'Dispositifs grand public')
- Concis : 1-4 mots
- Cœur de métier : Représente ce qui génère le business (produits phares, revenus clés)
- Capitalisation correcte : Majuscules initiales + acronymes (API, SQL, IA)
- En français uniquement
- Justifié : Chaque topic explique (1-2 phrases) sa pertinence et son lien au business de l'entreprise

# Instructions
1. Identifier dans la description : quels produits/services génèrent le revenu principal ?
2. Extraire UNIQUEMENT les éléments CONCRETS mentionnés (ne pas inventer d'activités)
3. Générer {count} topics DISTINCTS, du plus stratégique au moins stratégique

# Exemples ✅
- Apple : 'iPhone', 'Mac', 'iPad', 'Apple Watch', 'Services Apple'
- Stripe : 'Paiements en ligne', 'API de paiement', 'Facturation récurrente'

# Anti-patterns ❌
- Abstrait : 'Dispositifs grand public' (Apple), 'Systèmes écosystèmes', 'Solutions financières'
- Vague : 'Innovation', 'Qualité', 'Performance', 'Excellence'
- Hallucination : Inventer produits/activités non mentionnés dans la description
- Recouvrements : 'Vêtements techniques' + 'Vestes techniques'

# Format de sortie
Liste JSON de {count} objets au format { "topic": ..., "suggestions": ... }, ordonnés du plus important au moins important.`;

const defaultBrandDiscoveryPrompt = `Tu es un expert en simulation de comportement utilisateur pour les moteurs de recherche IA.
Ton objectif : Générer {count} prompts ultra-réalistes simulant un utilisateur en phase de RECHERCHE ou de DÉCISION.

### 🧠 PSYCHOLOGIE UTILISATEUR (CRITIQUE)
Les utilisateurs ne sont pas des robots. Ils ont des doutes, des contraintes et des préjugés.
Tu dois varier les **INTENTIONS** :
1. **Le Sceptique** : Cherche les pièges, les frais cachés ("est-ce que X est une arnaque ?", "avis négatifs sur...")
2. **Le Pragmatique** : Cherche une fonctionnalité précise ("logiciel avec export PDF auto", "app pour trajets récurrents")
3. **Le Déçu du concurrent** : Veut changer ("alternative à [Concurrent] moins cher", "marre de...")
4. **Le Novice** : Ne connait pas le jargon ("truc pour gérer mes clients", "machin pour partager trajets")

### 📊 RÉPARTITION SÉMANTIQUE
- **60% NEUTRES (Category Dominance)** : Ne cite PAS l'entreprise cible. Cherche la catégorie.
  Ex: "meilleur solution pour {topic}", "quelle app pour..."
- **40% MARQUE (Brand Authority)** : Cite l'entreprise cible (seule ou en comparaison).
  Ex: "{company} vs [Concurrent]", "prix {company} vaut le coup ?"

### ✍️ STYLE D'ÉCRITURE (CHAOS HUMAIN - CRITIQUE)
VARIE ABSOLUMENT les styles (ne fais pas que du conversationnel propre) :
- **20% Soigné** : Phrases complètes, grammaire correcte avec majuscules et ponctuation
- **50% Mots-clés courts (Google style)** : TOUT EN MINUSCULES, sans ponctuation finale
  Exemples: "comparatif blablacar flixbus", "app covoiturage gratuite iphone", "avis bus paris marseille"
- **20% Conversationnel** : "c'est quoi le mieux entre X et Y pour...", "genre je cherche..."
- **10% Sloppy** : Fautes de frappe, "bcp", "tjrs", "pb avec {company}", pas d'accents

### 🎯 CATÉGORIES DE PROMPTS
**1. Comparaison Directe (Versus)**
   - "[Concurrent] ou {company} pour [cas d'usage précis]"
   - "différences entre X et Y"
**2. Long Tail (Recherche par Attribut)**
   - "solution de [Secteur] compatible avec [Contrainte technique/OS/Budget]"
   - "[Produit] pas cher mais fiable"
**3. Preuve Sociale & Avis**
   - "retours expérience {company}"
   - "est-ce que les gens recommandent...", "pièges à éviter..."
**4. Switching (Changement)**
   - "remplacer [Concurrent] par mieux"
   - "alternative française à [Géant Américain]"
**5. Budget/Pricing**
   - "solution gratuite pour...", "frais cachés sur..."

### 📏 LONGUEUR & VARIÉTÉ (IMPÉRATIF)
TU DOIS ABSOLUMENT respecter cette distribution :
- **Courte traîne (40%)** : 2-5 mots MAXIMUM ("blablacar vs flixbus", "app covoiturage gratuite", "meilleur bus paris lyon")
- **Moyenne (40%)** : 6-12 mots ("quelle app covoiturage fiable pour trajets longue distance")
- **Longue traîne (20%)** : 13-25 mots avec contraintes multiples

# Format JSON attendu
{
  "prompt": "<texte brut sans préfixe>",
  "tag": "<Comparaison|LongTail|Avis|Switching|Alternative|Budget>"
}

Génère uniquement le JSON. PAS de préfixe "comparatif:", "avis:", etc.`;

const defaultOrganicMentionPrompt = `Tu es un utilisateur lambda qui a un problème concret à résoudre. Tu cherches de l'aide sur un moteur IA.
Objectif : Générer {count} prompts informationnels ultra-réalistes.

### 🧠 CONTEXTE D'USAGE
L'utilisateur ne cherche pas forcément à acheter, il cherche à **COMPRENDRE** ou **RÉSOUDRE**.
La mention de la marque doit être :
1. **Implicite (70%)** : "comment connecter mon compte bancaire à ma compta" (La réponse devrait citer la marque si elle le fait)
2. **Explicite Support (20%)** : "comment exporter pdf sur {company}", "configurer notifications {company}"
3. **Éducative (10%)** : "c'est quoi la différence entre [Terme Technique A] et [Terme Technique B]"

### 📊 RATIO D'INTENTION
- **70% Generic How-to** : Questions sur le métier/secteur sans citer de marque.
  *Pourquoi ? Pour que la marque ressorte comme la réponse experte à une question générique.*
- **30% Brand Specific** : Questions de support ou de configuration sur {company}.

### ✍️ STYLE & SYNTAXE
- **Troubleshooting** : "ça marche pas", "erreur lors de...", "impossible de...", "bug avec..."
- **Débutant** : "tuto pour...", "guide simple...", "pas à pas..."
- **Variété longueur** : Du mot-clé pur ("export csv compta") à la phrase contextuelle complexe
- **Langage naturel** : "galère pour...", "help", "comment on fait pour..."

### 🎯 CATÉGORIES
**1. Pain Points (Problèmes)**
   - "gérer X prend trop de temps solution"
   - "éviter erreurs de...", "synchronisation qui plante..."
**2. Tutos & How-to**
   - "comment faire X étape par étape"
   - "configurer [Feature] pour [Besoin précis]"
**3. Définitions & Culture Secteur**
   - "lexique...", "que veut dire...", "différence entre..."
**4. Intégrations & Écosystème**
   - "connecter {company} avec [Autre Outil Populaire du secteur]"
   - "api pour automatiser...", "importer données depuis..."
**5. Best Practices**
   - "optimiser...", "sécuriser...", "automatiser..."

### 📏 LONGUEUR & VARIÉTÉ (IMPÉRATIF)
TU DOIS ABSOLUMENT respecter cette distribution :
- **Courte (50%)** : 2-4 mots MAXIMUM ("export csv compta", "erreur sync", "tuto remboursement", "pb paiement")
- **Moyenne (30%)** : 5-10 mots ("comment configurer paiement automatique sur app")
- **Longue (20%)** : 11-20 mots avec contexte d'erreur technique détaillé

### 🎨 AUTHENTICITÉ (IMPORTANT)
- Mélange minuscules/majuscules de manière chaotique
- Occasionnellement : fautes de frappe, abréviations SMS ("pb", "tjrs", "bcp")
- Langage oral : "genre", "du coup", "carrément"

# Format JSON attendu
{
  "prompt": "<texte brut>",
  "tag": "<Problem|Tuto|Definition|Integration|Best-practice>"
}

Génère uniquement le JSON.`;

const defaultLLMSettings: LLMSettings = {
	model: 'gpt-5-mini',
	reasoning: 'low',
	verbosity: 'low',
	searchContextSize: 'low'
};

function createSessionStore() {
	const { subscribe, set, update } = writable<SessionState>({
		company: null,
		topics: [],
		prompts: [],
		companyPrompt: defaultCompanyPrompt,
		topicsPrompt: defaultTopicsPrompt,
		brandDiscoveryPrompt: defaultBrandDiscoveryPrompt,
		organicMentionPrompt: defaultOrganicMentionPrompt,
		llmSettings: defaultLLMSettings
	});

	return {
		subscribe,
		setCompany: (company: Company) => update((s) => ({ ...s, company })),
		setTopics: (topics: Topic[]) => update((s) => ({ ...s, topics })),
		setPrompts: (prompts: Prompt[]) => update((s) => ({ ...s, prompts })),
		addPrompts: (newPrompts: Prompt[]) => update((s) => ({ ...s, prompts: [...s.prompts, ...newPrompts] })),
		updateCompanyPrompt: (prompt: string) => update((s) => ({ ...s, companyPrompt: prompt })),
		updateTopicsPrompt: (prompt: string) => update((s) => ({ ...s, topicsPrompt: prompt })),
		updateBrandDiscoveryPrompt: (prompt: string) => update((s) => ({ ...s, brandDiscoveryPrompt: prompt })),
		updateOrganicMentionPrompt: (prompt: string) => update((s) => ({ ...s, organicMentionPrompt: prompt })),
		updateLLMSettings: (settings: Partial<LLMSettings>) => update((s) => ({
			...s,
			llmSettings: { ...s.llmSettings, ...settings }
		})),
		reset: () => set({
			company: null,
			topics: [],
			prompts: [],
			companyPrompt: defaultCompanyPrompt,
			topicsPrompt: defaultTopicsPrompt,
			brandDiscoveryPrompt: defaultBrandDiscoveryPrompt,
			organicMentionPrompt: defaultOrganicMentionPrompt,
			llmSettings: defaultLLMSettings
		})
	};
}

export const session = createSessionStore();

// Export defaults for reset functionality
export const defaultPrompts = {
	company: defaultCompanyPrompt,
	topics: defaultTopicsPrompt,
	brandDiscovery: defaultBrandDiscoveryPrompt,
	organicMention: defaultOrganicMentionPrompt
};
