# Design : Règles temporelles pour LED Status Panel

> Statut : **À implémenter** — design validé, pas encore codé.
> Rédigé le : 2026-04-05

---

## Vue d'ensemble

Deux features complémentaires, à implémenter ensemble car elles partagent la même infrastructure (timers, état mémorisé par assignment).

### Feature 1 — Délai de déclenchement (`for`)
> "La condition doit être vraie depuis X secondes avant d'activer la LED."

**Exemple :** Une porte ouverte depuis 5 minutes → LED rouge clignotante.
Si la porte se ferme avant 5 min, la LED ne change jamais.

### Feature 2 — Durée minimale d'affichage (`hold`)
> "Une fois déclenchée, la LED reste dans cet état au minimum X secondes."

**Exemple :** Capteur de mouvement → LED bleue pendant 5 min minimum.
Si le capteur repasse à off après 30s, la LED reste bleue jusqu'à la fin des 5 min,
puis réévalue l'état courant (off → gris).

---

## Format JSON des règles

### Aujourd'hui
```json
{
  "condition": "state == on",
  "color": "#0000ff",
  "behavior": "solid"
}
```

### Avec les nouvelles options (rétrocompatible — champs optionnels)
```json
{
  "condition": "state == on",
  "color": "#0000ff",
  "behavior": "solid",
  "for": 15,
  "hold": 300
}
```

- `for` : entier en secondes. La condition doit être vraie en continu depuis `for` secondes pour déclencher.
- `hold` : entier en secondes. Une fois la règle déclenchée, la LED reste dans cet état au minimum `hold` secondes.
- Les deux peuvent être combinés sur la même règle.
- Absence des champs = comportement actuel (aucun délai).

---

## Architecture — 3 couches à modifier

### 1. Backend Python (`custom_components/led_status_panel/__init__.py`)

C'est la couche critique : elle pilote réellement les LEDs.

#### Nouveau state par assignment
```python
# Dictionnaire global par entry : { assignment_id -> AssignmentTimerState }
@dataclass
class AssignmentTimerState:
    # Feature "for" : quand la condition courante est devenue vraie
    condition_since: dict[str, float]  # condition_str -> timestamp
    # Feature "hold" : quand la règle a été déclenchée + quelle règle
    hold_until: float | None           # timestamp d'expiration du hold
    hold_rule: dict | None             # règle en cours de hold
    hold_task: asyncio.Task | None     # task asyncio du timer hold
    for_task: asyncio.Task | None      # task asyncio du timer for
```

#### Logique `for` (délai de déclenchement)
```
On state_changed pour une entité :
  1. Évaluer les règles candidates (ignorer le champ "for" pour l'instant)
  2. Pour chaque règle candidate avec "for" > 0 :
     a. Si la condition était déjà vraie depuis timestamp T :
        - Si now() - T >= for → déclencher normalement
        - Sinon → créer asyncio.sleep(remaining) + déclencher à expiration
     b. Sinon (nouvelle condition) :
        - Enregistrer condition_since[condition] = now()
        - Créer asyncio.sleep(for) + déclencher à expiration
        - Annuler le timer précédent si la condition change avant expiration
  3. Règle sans "for" → déclencher immédiatement (comportement actuel)
```

#### Logique `hold` (durée minimale)
```
On state_changed :
  1. Vérifier si un hold est actif pour cet assignment :
     - Si hold_until > now() → ignorer le changement, garder la couleur actuelle
     - Sinon → évaluer normalement
  2. Quand une règle avec "hold" se déclenche :
     - Enregistrer hold_until = now() + hold
     - Enregistrer hold_rule = règle déclenchée
     - Créer asyncio.sleep(hold) → à expiration, réévaluer l'état courant
     - Annuler/remplacer le hold précédent si une règle de priorité supérieure se déclenche
```

#### Annulation des timers au unload
Dans `async_unload_entry` : annuler toutes les tasks asyncio en cours.

---

### 2. Évaluateur JS (`lovelace-card/src/utils/rule-evaluator.js`)

Aujourd'hui `evaluateRules()` est une fonction pure (stateless). Il faut la rendre stateful pour le preview live de la card.

#### Nouveau design
```js
// Singleton de state par entity_id
const _ruleTimerState = new Map(); // entityId -> { conditionSince, holdUntil, holdRule }

export function evaluateAssignmentWithTime(assignment, hassStates) {
  const entityId = assignment.entity_id;
  const stateObj = hassStates[entityId];
  const state = stateObj ? stateObj.state : "unavailable";
  const attributes = stateObj ? stateObj.attributes || {} : {};

  const timerState = _ruleTimerState.get(entityId) || {};

  // 1. Hold actif ? → retourner la règle en hold
  if (timerState.holdUntil && Date.now() < timerState.holdUntil) {
    return timerState.holdRule;
  }

  // 2. Évaluation normale + gestion "for"
  for (const rule of assignment.rules || []) {
    const matches = _ruleMatches(rule, state, attributes);
    const forMs = (rule.for || 0) * 1000;

    if (matches && forMs > 0) {
      const since = timerState.conditionSince?.[rule.condition];
      if (!since) {
        // Nouvelle condition vraie → mémoriser le timestamp
        _setConditionSince(entityId, rule.condition, Date.now());
        continue; // Pas encore déclenché
      }
      if (Date.now() - since < forMs) continue; // Pas encore assez longtemps
      // OK → déclencher + activer hold si défini
      _activateHold(entityId, rule);
      return rule;
    }

    if (matches) {
      _activateHold(entityId, rule);
      return rule;
    } else {
      _clearConditionSince(entityId, rule.condition);
    }
  }
  return null;
}
```

> Note : Le JS est pour le **preview live uniquement**. L'état n'est pas persisté entre rechargements de page. C'est acceptable.

---

### 3. UI — `rule-row.js` et `rules-editor.js`

#### Ajout dans `rule-row.js`
Deux champs optionnels après le color picker :

```
[ SI ] [ condition ] [ couleur ] [ comportement ] [ pour: ___s ] [ hold: ___s ] [ ↑ ↓ ✕ ]
```

- Champ `pour X sec` : input number, placeholder "0 (désactivé)", min=0
- Champ `hold X sec` : input number, placeholder "0 (désactivé)", min=0
- Valeur 0 ou vide = feature désactivée (comportement actuel)

#### Chips de suggestion dans `rules-editor.js`
Ajouter des chips courantes :
- `hold: 60` (1 min)
- `hold: 300` (5 min)
- `for: 15` (15 sec)
- `for: 300` (5 min)

---

## Interactions entre les deux features

| Scénario | Résultat attendu |
|---|---|
| `for: 15` seulement | Déclenche après 15s de condition vraie, revient immédiatement si condition change |
| `hold: 300` seulement | Déclenche immédiatement, reste 5 min même si condition redevient fausse |
| `for: 15` + `hold: 300` | Déclenche après 15s, puis reste 5 min minimum |
| Condition change pendant un `hold` actif | Ignorée jusqu'à expiration du hold |
| Règle de priorité plus haute pendant un `hold` | Le hold est annulé, la nouvelle règle prend effet |

---

## Ordre d'implémentation recommandé

1. **Backend Python** — infrastructure timers asyncio + `AssignmentTimerState`
2. **Tests manuels** backend seul (via HA)
3. **JS rule-evaluator** — version stateful pour le preview
4. **UI rule-row** — champs `for` et `hold`
5. **Chips de suggestion** dans rules-editor

---

## Points d'attention

- **Rétrocompatibilité** : les champs `for` et `hold` sont optionnels → aucune migration de config requise.
- **Persistence du hold** : si HA redémarre pendant un hold actif, le hold est perdu. Acceptable pour V1.
- **Priorité des règles** : l'ordre actuel (première règle qui match) reste valable. Un hold peut être "écrasé" par une règle d'importance plus haute.
- **Performance** : chaque assignment actif avec des timers crée une task asyncio. Avec 30 assignments, c'est négligeable.
