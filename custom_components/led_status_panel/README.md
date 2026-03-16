# LED Status Panel — Home Assistant integration

This integration loads a JSON configuration file, listens to entity state changes, evaluates rules per assignment, and calls the ESPHome `set_led` service on your panel device.

## Installation

Copy the `led_status_panel` folder into your Home Assistant `custom_components` directory.

## Configuration (configuration.yaml)

```yaml
led_status_panel:
  config_file: led_panel_config.json   # path relative to config or absolute
  entity_id: light.led_status_panel_led_status_panel   # entité ESPHome du panneau
```

- **config_file**: Path to the JSON config produced by the web editor (e.g. in `/config/`).
- **entity_id**: L’entité du panneau ESPHome (ex. `light.led_status_panel_led_status_panel`). Paramètres → Périphériques → ton panneau → liste des entités.

After editing `configuration.yaml`, restart Home Assistant. The integration will load assignments and subscribe to the configured entities; on state change it will evaluate rules and call `set_led` on the ESP.

**Migration** : si tu avais `device_id`, remplace par `entity_id` avec l’entité du panneau (ex. `light.led_status_panel_led_status_panel`).

## Requirements

- ESPHome device with the `set_led` custom service (this repo’s firmware).
- JSON config in the format produced by the web editor (see documentation).

## Dépannage — « Rien dans les logs » ou « Rien ne se passe »

### Si tu n’as **aucune** ligne « LED Status Panel » dans les journaux après redémarrage

1. **Emplacement du custom component**  
   Le dossier doit être exactement :  
   `<dossier config HA>/custom_components/led_status_panel/`  
   avec dedans : `__init__.py`, `const.py`, `manifest.json`, `README.md`.  
   Sur HA OS / container, le dossier config est souvent `/config`, donc :  
   `/config/custom_components/led_status_panel/`.

2. **Chargement de `configuration.yaml`**  
   Le bloc doit être à la **racine** de `configuration.yaml` (pas dans un autre bloc) :
   ```yaml
   led_status_panel:
     config_file: led_panel_config.json
     entity_id: light.led_status_panel_led_status_panel
   ```
   Après toute modification, **redémarrer** Home Assistant (pas seulement recharger les intégrations).

3. **Niveau des journaux**  
   Paramètres → Système → Journaux : vérifier que le niveau affiche au moins **Avertissement** (Warning).  
   Rechercher dans la page : `LED Status Panel`.

4. **Ce que tu dois voir si tout est OK**  
   Au démarrage, tu dois avoir au moins une de ces lignes :
   - `LED Status Panel: aucun bloc 'led_status_panel' dans configuration.yaml` → le composant est chargé mais le bloc manque dans le YAML.
   - `LED Status Panel: démarrage (configuration détectée)...` puis `config chargée` puis `prêt — écoute N entité(s)` → l’intégration tourne.

5. **Si tu vois « entité … introuvable »**  
   Corriger le `entity_id` (Paramètres → Périphériques → panneau ESPHome → entités du périphérique, ex. `light.led_status_panel_...`).

### Renommer le service ESPHome

Si tu renommes le service dans le firmware ESPHome, mets à jour la constante `SERVICE_SET_LED` dans `custom_components/led_status_panel/const.py` pour qu’elle corresponde au nouveau nom.

### « Service not found » ou « extra keys » avec plusieurs panneaux

L’intégration appelle le service **sans cible** (l’API ESPHome rejette `entity_id` dans les data). Avec **un seul** panneau ESPHome qui expose ce service, ça fonctionne. Avec **plusieurs** panneaux, HA peut ne pas trouver le service ou l’envoyer au mauvais device. Dans ce cas : n’avoir qu’un seul device ESPHome avec ce service, ou créer une **automatisation/script** qui cible l’entité du panneau et déclencher ce script depuis l’intégration (avancé).

6. **Au démarrage**  
   L’état initial des entités est appliqué aux LEDs **45 secondes** après le chargement (pour laisser ESPHome se connecter). Si le service n’est pas encore enregistré, un seul avertissement apparaît : *« service set_led non trouvé … »* ; les LEDs se mettront à jour au prochain changement d’état. Pas de traceback dans ce cas.

7. **Quand tu allumes/éteins la light**  
   Tu devrais voir une ligne du type :  
   `LED Status Panel: light.xxx = on → règle « state == on » → 1 LED(s)`.  
   Si cette ligne n’apparaît pas alors que « prêt — écoute » est là, l’entité écoutée n’est peut‑être pas la bonne (vérifier l’`entity_id` dans le JSON).
