# LED Status Panel — Web Editor

React app to configure panel layout and assignments. Export JSON for use with the Home Assistant custom component.

## Run (standalone)

```bash
npm install
npm run dev
```

Open the URL shown (e.g. http://localhost:5173). Use **Export JSON** to download `led_panel_config.json` and place it in your HA config directory; configure the integration via **Paramètres → Intégrations → LED Status Panel** (config file + entity).

---

## Intégrer l’éditeur dans Home Assistant (méthode simple)

Aucun `configuration.yaml` ni redémarrage : tu ajoutes l’éditeur comme **carte** dans un tableau de bord.

### 1. Récupérer les fichiers

**Option A — Téléchargement (recommandé)**  
Sur [Releases](https://github.com/djiesr/HA-LED-Status-Panel/releases), télécharge **led-panel-editor.zip**, décompresse-le.

**Option B — Build local**  
```bash
npm install
npm run build:ha
```
Les fichiers sont dans le dossier `dist/`.

### 2. Les mettre dans HA

Copie **tout le contenu** du zip (ou de `dist/`) dans le dossier **www** de ta config HA, dans un sous-dossier `led-panel-editor` :

- **Dossier cible :** `<config>/www/led-panel-editor/`
- Il doit contenir au minimum : `index.html`, `assets/` (et les fichiers dedans).

### 3. Ajouter l’éditeur comme carte

1. Ouvre un **tableau de bord** (ou crée-en un).
2. **Éditer le tableau** (crayon) → **Ajouter une carte**.
3. En bas : **« Ajouter une carte manuellement »** (ou « Par code »).
4. Choisis le type **« Carte iframe »** / **« Web frame »** (ou **« Carte de site web »** selon la langue).
5. **URL :** ` /local/led-panel-editor/`
6. Enregistre. L’éditeur s’affiche dans la carte.

Tu peux déplacer la carte, la mettre dans un onglet dédié « LED Panel », etc.

---

## Option : éditeur dans la barre latérale (panel_custom)

Si tu préfères un lien dans la barre latérale (comme une « App ») :

1. Fais les étapes 1 et 2 ci-dessus (fichiers dans `www/led-panel-editor/`).
2. Dans `configuration.yaml`, ajoute :
   ```yaml
   panel_custom:
     - name: led-panel-editor
       sidebar_title: LED Panel Editor
       sidebar_icon: mdi:led-strip
       url_path: led-panel-editor
       module_url: /local/led-panel-editor/panel.js
   ```
3. Redémarre Home Assistant. « LED Panel Editor » apparaît dans la barre latérale.

---

## Features

- **3 colonnes** : liste des entités HA (recherche), assignation (règles, possibilités, importance), panneaux 8×8.
- Connexion HA (URL + token en localStorage), chargement des entités, sélection par clic. Pas d’export des secrets dans le JSON.
- Règles : condition (state, attribute, default, unavailable), couleur, comportement. Bouton pour supprimer une règle.
- Grille : clic sur case non assignée = ajout à la sélection ; clic sur case assignée = chargement pour édition. Sous chaque panneau : « Supprimer une case » (mode clic), « Tout supprimer » (avec confirmation).
- Export / Import JSON. Langue : EN / FR (i18n).
