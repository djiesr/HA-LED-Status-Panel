# HA-LED-Status-Panel

Panneaux LED 8×8 (WS281x) qui affichent l’état des entités Home Assistant. Configurables via un éditeur web ; pilotés par une intégration HA et un firmware ESPHome.

**Dépôt :** [github.com/djiesr/HA-LED-Status-Panel](https://github.com/djiesr/HA-LED-Status-Panel)

---

## Prérequis

- **Matériel :** ESP8266 D1 mini (ou compatible), 1 ou 2× panneaux 8×8 WS281x.
- **Home Assistant :** 2026.3 ou plus récent.
- **ESPHome :** 2024.x (API native, `custom_services: true`).

---

## Installation et configuration (résumé)

| Étape | Où | Action |
|-------|-----|--------|
| 1. Firmware | ESPHome | Copier [esphome/](esphome/), configurer WiFi/pin, flasher l’ESP. |
| 2. Intégration HA | HA | Installer [custom_components/led_status_panel/](custom_components/led_status_panel/) (ou via HACS en dépôt personnalisé). |
| 3. Config intégration | HA → Intégrations | Ajouter « LED Status Panel », indiquer le fichier JSON et l’entité du panneau (light ESPHome). |
| 4. Fichier JSON | Dossier config HA | Créer le JSON avec l’éditeur web, le placer dans config (ex. `led_panel_config.json`). |
| 5. Éditeur (optionnel) | Tableau de bord HA | Carte iframe ` /local/led-panel-editor/` après avoir copié le contenu du zip dans `www/led-panel-editor/`. |

Détails ci‑dessous.

---

## 1. Firmware ESPHome

1. Ouvre le dossier [esphome/](esphome/) : tu y trouveras `led_status_panel.yaml` et le composant custom dans `components/`.
2. Dans `led_status_panel.yaml` :
   - Renseigne **WiFi** (ou utilise des secrets).
   - Vérifie le **pin** des LEDs (ex. D4).
   - Pour **2 panneaux en série** : mets `num_leds: 128` dans `light` et dans `led_status_panel`.
3. Compile et flashe via **ESPHome Dashboard** ou en CLI : `esphome run led_status_panel.yaml`.
4. Une fois connecté, l’appareil et l’entité **light** apparaissent dans Home Assistant.

---

## 2. Intégration Home Assistant

### Installation de l’intégration

- **Manuelle :** télécharge le dépôt (ou clone), copie le dossier **`custom_components/led_status_panel`** dans le répertoire **`custom_components`** de ta config HA (à côté de `configuration.yaml`).
- **HACS (dépôt personnalisé) :** Paramètres → Modules complémentaires → HACS → Dépôts personnalisés → URL `https://github.com/djiesr/HA-LED-Status-Panel`, type **Intégration** → Installer.

Redémarre Home Assistant si l’intégration n’apparaît pas.

### Configuration de l’intégration

1. **Paramètres** → **Appareils et services** → **Intégrations** → **Ajouter une intégration**.
2. Recherche **LED Status Panel**.
3. **Fichier de config :** chemin du fichier JSON, relatif au dossier config (ex. `led_panel_config.json`). Ce fichier doit déjà exister (tu peux créer un fichier vide au début, puis le remplir avec l’éditeur).
4. **Entité du panneau :** choisis l’entité **light** exposée par ton appareil ESPHome (ex. `light.led_status_panel_led_status_panel`).

Tu peux modifier ces réglages plus tard via **Options** sur la carte de l’intégration.

---

## 3. Fichier JSON de configuration

Le JSON décrit les panneaux, le layout et les **assignations** (quelle entité HA contrôle quelles LEDs, avec quelles règles et couleurs).

- **Création / édition :** utilise l’**éditeur web** (voir section 5) ou écris le JSON à la main.
- **Emplacement :** n’importe où dans ta config HA ; le chemin indiqué dans l’intégration doit être relatif au dossier config (ex. `led_panel_config.json` ou `config/led_panel_config.json` selon ta structure).

Exemple minimal :

```json
{
  "panels": 1,
  "panel_layout": "zigzag_h",
  "panel_options": [{ "flip_h": false, "flip_v": false, "layout": "zigzag_h" }],
  "assignments": []
}
```

Voir [custom_components/led_status_panel/README.md](custom_components/led_status_panel/README.md) pour le détail des champs et le dépannage.

---

## 4. Éditeur web (optionnel)

L’éditeur permet de configurer visuellement les panneaux et les assignations, puis d’exporter le JSON.

- **Sans l’intégrer dans HA :** lance `npm install` puis `npm run dev` dans [web-editor/](web-editor/), ouvre l’URL affichée, exporte le JSON et place‑le dans ta config.
- **Dans HA (carte iframe) :**
  1. Télécharge **led-panel-editor.zip** depuis les [Releases](https://github.com/djiesr/HA-LED-Status-Panel/releases) (ou lance la workflow « Build web editor » et récupère l’artifact).
  2. Décompresse le zip et copie **tout son contenu** dans `<config>/www/led-panel-editor/`.
  3. Dans un tableau de bord : **Ajouter une carte** → **Carte iframe / Web frame** → URL : ` /local/led-panel-editor/`.

Instructions détaillées : [web-editor/README.md](web-editor/README.md).

---

## Structure du dépôt

| Dossier | Description |
|--------|-------------|
| [esphome/](esphome/) | Firmware ESP8266 : strip WS281x, service `set_led`, comportements (solid, blink, pulse). |
| [custom_components/led_status_panel/](custom_components/led_status_panel/) | Intégration HA : chargement JSON, écoute des entités, règles, appels au service ESPHome. |
| [web-editor/](web-editor/) | App React : grille 8×8, assignations, export/import JSON. i18n FR/EN. |
| [documentation/](documentation/) | Concept et suivi du projet. |

---

## Licence

MIT — usage libre.
