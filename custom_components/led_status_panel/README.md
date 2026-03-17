# LED Status Panel — Home Assistant integration

Cette intégration charge un fichier de configuration JSON, écoute les changements d’état des entités, évalue les règles par assignation et appelle le service ESPHome `set_led` sur le panneau.

## Installation

Copie le dossier `led_status_panel` dans le répertoire `custom_components` de Home Assistant.

## Configuration (menu Intégrations)

**Plus de configuration YAML.** Tout se fait via l’interface :

1. **Paramètres** → **Appareils et services** → **Intégrations** → **Ajouter une intégration**.
2. Recherche **LED Status Panel**.
3. Saisis le **chemin du fichier JSON** (ex. `led_panel_config.json`, relatif au dossier config HA).
4. Choisis l’**entité du panneau** (light exposée par ESPHome).

Le fichier JSON doit exister et être un JSON valide (exporté depuis l’éditeur web). Tu peux modifier l’entrée plus tard via **Options** sur la carte de l’intégration.

## Format JSON (éditeur web)

Le JSON peut contenir :

- **panels** : nombre de panneaux (1, 2 ou 3).
- **panel_options** : liste d’options par panneau (optionnel) :
  - **flip_h** : miroir horizontal (booléen).
  - **flip_v** : miroir vertical (booléen).
  - **layout** : `"zigzag_h"` (serpentin horizontal) ou `"zigzag_v"` (serpentin vertical).
- **assignments** : liste d’assignations (entité, règles, leds, importance).

Exemple minimal :

```json
{
  "panels": 1,
  "panel_options": [{ "flip_h": false, "flip_v": false, "layout": "zigzag_h" }],
  "assignments": []
}
```

## Prérequis

- Appareil ESPHome avec le service custom `set_led` (firmware de ce dépôt).
- Fichier JSON au format produit par l’éditeur web.

## Dépannage

### Aucune ligne « LED Status Panel » dans les journaux

1. **Emplacement** : `<config>/custom_components/led_status_panel/` avec `__init__.py`, `config_flow.py`, `const.py`, `manifest.json`, `strings.json`, `README.md`.
2. **Configuration** : ajout de l’intégration via **Intégrations** (pas de bloc YAML).
3. **Niveau des journaux** : au moins **Avertissement** ; recherche « LED Status Panel ».

### « Service set_led non trouvé »

L’intégration démarre parfois avant qu’ESPHome n’enregistre le service. Elle :

- **Réessaie** plusieurs fois avec délai (5 s) avant d’abandonner.
- **Réapplique** l’état initial quand l’entité du panneau devient disponible (reconnexion ESP).
- **Réapplique** aussi après 45 s au premier chargement.

Si le message apparaît une fois puis plus rien : normal au démarrage. Les LEDs se mettent à jour au prochain changement d’état ou à la reconnexion du panneau.

### Deux panneaux sur le même ESP (chaînés)

Un 2ᵉ panneau physique branché en série sur la même bande = **un seul device**, une seule entité. Les index LED 64–127 sont envoyés au même service. Vérifie que dans ta config ESPHome le composant `light` (neopixelbus) et `led_status_panel` ont **`num_leds: 128`** (et non 64), sinon le firmware ignore les index ≥ 64.

### Deux installations (2 appareils ESP distincts)

Pour une 2ᵉ installation (2ᵉ ESP) : **Ajouter une intégration** → LED Status Panel, puis configurer le 2ᵉ fichier JSON et l’entité du 2ᵉ panneau. Chaque entrée appelle le service de son appareil.

### Renommer le service ESPHome

Si tu renommes le service dans le firmware, mets à jour `SERVICE_SET_LED_SUFFIX` et `ENTITY_OBJECT_ID_SUFFIX` dans `const.py`.
