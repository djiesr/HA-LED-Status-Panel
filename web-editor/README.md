# LED Status Panel — Web Editor

React app to configure panel layout and assignments. Export JSON for use with the Home Assistant custom component.

## Run (standalone)

```bash
npm install
npm run dev
```

Open the URL shown (e.g. http://localhost:5173). Use **Export JSON** to download `led_panel_config.json` and place it in your HA config directory; configure `config_file` and `entity_id` in `configuration.yaml` as per the custom component README.

## Ajouter l’éditeur comme « App » dans Home Assistant

1. **Build pour HA** : `npm run build:ha` (génère un build avec base `/local/led-panel-editor/`).
2. **Copier** tout le contenu du dossier `dist/` dans le dossier **www** de ta config HA, sous un sous-dossier `led-panel-editor` :  
   `<config>/www/led-panel-editor/` doit contenir `index.html`, `panel.js`, `assets/`, etc.
3. **Ajouter le panel** dans `configuration.yaml` :
   ```yaml
   panel_custom:
     - name: led-panel-editor
       sidebar_title: LED Panel Editor
       sidebar_icon: mdi:led-strip
       url_path: led-panel-editor
       module_url: /local/led-panel-editor/panel.js
   ```
4. **Redémarrer** Home Assistant. L’entrée « LED Panel Editor » apparaît dans la barre latérale (Apps).

## Features

- **3 colonnes** : liste des entités HA (recherche), assignation (règles, possibilités, importance), panneaux 8×8.
- Connexion HA (URL + token en localStorage), chargement des entités, sélection par clic. Pas d’export des secrets dans le JSON.
- Règles : condition (state, attribute, default, unavailable), couleur, comportement. Bouton pour supprimer une règle.
- Grille : clic sur case non assignée = ajout à la sélection ; clic sur case assignée = chargement pour édition. Sous chaque panneau : « Supprimer une case » (mode clic), « Tout supprimer » (avec confirmation).
- Export / Import JSON. Langue : EN / FR (i18n).
