/**
 * Simple i18n for the Lovelace card.
 * Detects language from hass.locale.language or navigator.language.
 */

const TRANSLATIONS = {
  fr: {
    // Card
    "card.title":          "Panneau LED",
    "card.loading":        "Chargement…",
    "card.reload":         "Recharger",
    "card.live":           "⬤ Live",
    "card.live.on":        "Mode live activé",
    "card.live.off":       "Mode live désactivé",
    "card.empty":          "Aucune configuration chargée.",
    "card.hint":           "Cliquez sur les LEDs pour les sélectionner, puis « Configurer »",
    "card.error.panel":    "Panneau introuvable",
    "card.error.config":   "Erreur lecture config",
    "card.error.network":  "Erreur réseau",
    "card.panel.label":    "Panneau",
    // Selection bar
    "sel.leds":            "LED sélectionnée",
    "sel.leds.plural":     "LEDs sélectionnées",
    "sel.clear":           "✕ Désélectionner",
    "sel.configure":       "⚙ Configurer",
    // Save toast
    "save.saving":         "Sauvegarde…",
    "save.reloading":      "Rechargement…",
    "save.saved":          "Sauvegardé et rechargé ✓",
    "save.saved.noreload": "Sauvegardé ✓ (rechargement manuel requis)",
    "save.error":          "Erreur sauvegarde",
    // Dialog
    "dlg.new":             "Nouvelle assignation",
    "dlg.edit":            "Modifier assignation",
    "dlg.entity":          "Entité",
    "dlg.entity.ph":       "Chercher une entité… (ex: sensor.batterie)",
    "dlg.importance":      "Importance / Luminosité",
    "dlg.imp.low":         "Faible (15%)",
    "dlg.imp.medium":      "Moyenne (30%)",
    "dlg.imp.high":        "Haute (100%)",
    "dlg.leds":            "LEDs assignées",
    "dlg.cancel":          "Annuler",
    "dlg.save":            "Sauvegarder",
    "dlg.saving":          "Sauvegarde…",
    "dlg.delete":          "Supprimer",
    "dlg.state":           "État",
    // Rules editor
    "rules.title":         "Règles (première correspondance)",
    "rules.add":           "+ Ajouter règle",
    "rules.template":      "Appliquer un modèle…",
    "rules.if":            "SI",
    "rules.elif":          "SINON SI",
    "rules.else":          "SINON",
    // Behaviors
    "beh.solid":           "Continu",
    "beh.blink_fast":      "Clignotement rapide",
    "beh.blink_slow":      "Clignotement lent",
    "beh.pulse":           "Pulsation",
    "beh.off":             "Éteint",
    // Templates
    "tpl.batterie":        "Batterie",
    "tpl.on_off":          "On/Off",
    "tpl.unavailable":     "Alerte indisponible",
    // Card editor
    "editor.panel_code":   "Code du panneau (entity_id de la lumière ESPHome)",
    "editor.panel_code.ph":"light.led_status_panel",
    "editor.panel_code.h": "Ex: light.bureau_led_status_panel",
    "editor.config_path":  "Chemin du fichier de config (optionnel)",
    "editor.config_path.h":"Relatif au dossier config HA. Laissez vide pour utiliser le chemin enregistré dans l'intégration.",
    "editor.title":        "Titre de la carte (optionnel)",
    "editor.title.ph":     "Panneau LED",
  },

  en: {
    // Card
    "card.title":          "LED Panel",
    "card.loading":        "Loading…",
    "card.reload":         "Reload",
    "card.live":           "⬤ Live",
    "card.live.on":        "Live mode enabled",
    "card.live.off":       "Live mode disabled",
    "card.empty":          "No configuration loaded.",
    "card.hint":           "Click LEDs to select them, then \"Configure\"",
    "card.error.panel":    "Panel not found",
    "card.error.config":   "Error reading config",
    "card.error.network":  "Network error",
    "card.panel.label":    "Panel",
    // Selection bar
    "sel.leds":            "LED selected",
    "sel.leds.plural":     "LEDs selected",
    "sel.clear":           "✕ Deselect",
    "sel.configure":       "⚙ Configure",
    // Save toast
    "save.saving":         "Saving…",
    "save.reloading":      "Reloading…",
    "save.saved":          "Saved and reloaded ✓",
    "save.saved.noreload": "Saved ✓ (manual reload required)",
    "save.error":          "Save error",
    // Dialog
    "dlg.new":             "New assignment",
    "dlg.edit":            "Edit assignment",
    "dlg.entity":          "Entity",
    "dlg.entity.ph":       "Search an entity… (e.g. sensor.battery)",
    "dlg.importance":      "Importance / Brightness",
    "dlg.imp.low":         "Low (15%)",
    "dlg.imp.medium":      "Medium (30%)",
    "dlg.imp.high":        "High (100%)",
    "dlg.leds":            "Assigned LEDs",
    "dlg.cancel":          "Cancel",
    "dlg.save":            "Save",
    "dlg.saving":          "Saving…",
    "dlg.delete":          "Delete",
    "dlg.state":           "State",
    // Rules editor
    "rules.title":         "Rules (first match wins)",
    "rules.add":           "+ Add rule",
    "rules.template":      "Apply a template…",
    "rules.if":            "IF",
    "rules.elif":          "ELSE IF",
    "rules.else":          "ELSE",
    // Behaviors
    "beh.solid":           "Solid",
    "beh.blink_fast":      "Fast blink",
    "beh.blink_slow":      "Slow blink",
    "beh.pulse":           "Pulse",
    "beh.off":             "Off",
    // Templates
    "tpl.batterie":        "Battery",
    "tpl.on_off":          "On/Off",
    "tpl.unavailable":     "Unavailable alert",
    // Card editor
    "editor.panel_code":   "Panel code (ESPHome light entity_id)",
    "editor.panel_code.ph":"light.led_status_panel",
    "editor.panel_code.h": "E.g. light.office_led_status_panel",
    "editor.config_path":  "Config file path (optional)",
    "editor.config_path.h":"Relative to HA config folder. Leave empty to use the path stored in the integration.",
    "editor.title":        "Card title (optional)",
    "editor.title.ph":     "LED Panel",
  },
};

/**
 * Get translation function for the given hass object.
 * Usage: const t = getT(hass); t("card.title")
 */
export function getT(hass) {
  const lang = (hass?.locale?.language || navigator.language || "en")
    .toLowerCase()
    .split("-")[0];
  const dict = TRANSLATIONS[lang] || TRANSLATIONS["en"];
  return (key) => dict[key] ?? TRANSLATIONS["en"][key] ?? key;
}
