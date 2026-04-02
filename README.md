# HA LED Status Panel

Panneaux LED WS2812 8×8 pilotés par Home Assistant. Chaque LED peut refléter l'état d'une entité HA avec des couleurs, des comportements (fixe, clignotant, pulse) et des règles conditionnelles.

**Dépôts :**
- Intégration : [djiesr/HA-LED-Status-Panel](https://github.com/djiesr/HA-LED-Status-Panel)
- Carte Lovelace : [djiesr/led-panel-card](https://github.com/djiesr/led-panel-card)

---

## Matériel

Identique à une installation WLED, avec un panneau 8×8 à la place d'un strip :

- **Microcontrôleur :** ESP8266 D1 Mini (ou ESP32)
- **Panneau(x) :** 1 à 3 × matrice WS2812B 8×8 (64 LEDs chacun)
- **Alimentation :** 5V — prévoir ~3A par panneau à pleine luminosité
- **Câblage :**
  - DATA : D4 (GPIO2) sur D1 Mini — résistance 330 Ω en série recommandée
  - Condensateur 1000 µF entre 5V et GND côté panneau
  - Si plusieurs panneaux : chaîner la sortie DATA du premier vers l'entrée du suivant

> Les panneaux 8×8 WS2812B sont disponibles directement soudés en matrice. Le fil DATA entre toujours par un coin — vérifier le sens (serpentin H ou V) avec une LED de test avant l'installation définitive.

---

## 1. ESPHome

1. Copie le contenu du dossier [esphome/](esphome/) dans ton instance ESPHome.
2. Édite `led_status_panel.yaml` :
   - **WiFi** : renseigne ton SSID/mot de passe (ou utilise `secrets.yaml`).
   - **Pin** : vérifie que `pin: D4` correspond à ton câblage.
   - **Nombre de LEDs** : `num_leds: 64` pour 1 panneau, `128` pour 2, `192` pour 3.
3. Flashe via ESPHome Dashboard ou en CLI :
   ```bash
   esphome run led_status_panel.yaml
   ```
4. Une fois connecté, l'entité `light.led_status_panel` apparaît dans Home Assistant.

---

## 2. Intégration Home Assistant

### Installation

**Via HACS (recommandé) :**
1. HACS → Intégrations → ⋮ → Dépôts personnalisés
2. URL : `djiesr/HA-LED-Status-Panel` — Type : **Intégration**
3. Installer → Redémarrer Home Assistant

**Manuelle :**
Copier le dossier `custom_components/led_status_panel/` dans le dossier `custom_components/` de ta config HA, puis redémarrer.

### Configuration

1. **Paramètres** → **Appareils et services** → **+ Ajouter une intégration** → **LED Status Panel**
2. **Fichier de config :** chemin relatif au dossier config HA (ex. `led_panel_config.json`)
3. **Entité du panneau :** l'entité `light` exposée par ESPHome
4. **Nombre de panneaux :** 1, 2 ou 3
5. **Pour chaque panneau :** coin de départ du serpentin + sens (horizontal ou vertical)

> Les réglages sont modifiables ensuite via **Options** sur la carte de l'intégration.

---

## 3. Carte Lovelace

La carte permet de visualiser les panneaux en temps réel et de configurer les assignations LED directement depuis HA.

### Installation

**Via HACS :**
1. HACS → Frontend → ⋮ → Dépôts personnalisés
2. URL : `djiesr/led-panel-card` — Type : **Lovelace**
3. Installer
4. **Paramètres** → **Tableaux de bord** → ⋮ → **Ressources** → **+ Ajouter** :
   - URL : `/hacsfiles/led-panel-card/led-panel-card.js`
   - Type : **Module JavaScript**

### Ajout dans un tableau de bord

Ajouter une carte → **Custom: LED Panel Card**, puis configurer :

```yaml
type: custom:led-panel-card
panel_code: MON_PANNEAU   # code du panneau (optionnel)
config_path: led_panel_config.json
title: Mon panneau LED
```

### Fonctionnalités

- Grille interactive 8×8 — clic pour configurer une LED
- Sélection multi-LED (Ctrl+clic ou barre de sélection)
- Éditeur de règles **if / elif / else** par LED
- **Mode live** : couleurs et animations en temps réel
- Tooltips au survol : entité associée + état courant
- Animations visibles en live : blink rapide, blink lent, pulse
- Interface en **français et anglais**

---

## 4. Éditeur web

L'éditeur web React permet de configurer les panneaux et d'exporter le fichier JSON, sans passer par HA.

**Utilisation locale :**
```bash
cd web-editor/
npm install
npm run dev
```
Ouvre l'URL affichée, configure tes panneaux, exporte le JSON et place-le dans ton dossier config HA.

**Dans HA (carte iframe) :**
1. Télécharge `led-panel-editor.zip` depuis les [Releases](https://github.com/djiesr/HA-LED-Status-Panel/releases)
2. Décompresse dans `<config>/www/led-panel-editor/`
3. Ajouter une carte → **Iframe** → URL : `/local/led-panel-editor/`

> L'éditeur web est utile pour la création initiale du JSON. La carte Lovelace est plus pratique pour les modifications quotidiennes.

---

## Notes de version

### v0.2.0 — Carte Lovelace native
- Grille LED interactive, sélection multi-LED, règles if/elif/else
- Mode live + tooltips + animations
- Config flow multi-panneaux (1–3) avec choix du serpentin
- Rechargement automatique de l'intégration après sauvegarde
- Re-application des états LEDs à chaque reconnexion ESPHome
- Fix : LEDs éteintes après reboot HA
- Fix : retry sur erreurs de connexion ESPHome

### v0.1.3
- Correction création du fichier JSON manquant
- Améliorations de l'éditeur web

### v0.1.0
- Version initiale : intégration HA + firmware ESPHome + éditeur web React

---

## Licence

MIT — usage libre.
