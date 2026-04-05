import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import { getHaTokenBestEffort, isRunningInsideHomeAssistant, haReadLedPanelConfig, haWriteLedPanelConfig, listenForHaAuthMessage } from './ha.js';

const STORAGE_HA_URL = 'led_panel_ha_url';
const STORAGE_HA_TOKEN = 'led_panel_ha_token';
const STORAGE_HA_CONFIG_PATH = 'led_panel_ha_config_path';

const DEFAULT_CONFIG = {
  panels: 1,
  panel_layout: 'zigzag_h',
  panel_options: [{ flip_h: false, flip_v: false, layout: 'zigzag_h' }],
  assignments: [],
};

/** Compute 0-based LED index for one panel (8x8) from (row, col) with flip and layout. */
function cellToIndex(row, col, opts = {}) {
  let r = row;
  let c = col;
  if (opts.flip_h) c = 7 - c;
  if (opts.flip_v) r = 7 - r;
  const layout = opts.layout || 'zigzag_h';
  if (layout === 'zigzag_h') {
    return r % 2 === 0 ? r * 8 + c : r * 8 + (7 - c);
  }
  if (layout === 'zigzag_v') {
    return c % 2 === 0 ? c * 8 + r : c * 8 + (7 - r);
  }
  return r * 8 + c;
}

async function fetchHaStates(haUrl, haToken, signal) {
  const base = haUrl.replace(/\/$/, '');
  const token = String(haToken || '').trim().replace(/^Bearer\s+/i, '');
  const res = await fetch(`${base}/api/states`, {
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    let body = '';
    try {
      body = await res.text();
    } catch (_) {}
    const detail = body ? ` — ${body.slice(0, 300)}` : '';
    throw new Error(`HTTP ${res.status} ${res.statusText}${detail}`);
  }
  return res.json();
}

const defaultAssignment = () => ({
  id: '',
  label: '',
  entity_id: '',
  importance: 'medium',
  brightness_base: 30,
  rules: [{ condition: 'default', color: '#00FF00', behavior: 'solid' }],
});

// Fallback si templates.json absent ou invalide (aligné sur lovelace-card color-utils + templates.json)
const DEFAULT_RULE_TEMPLATES = [
  {
    id: 'batterie',
    name: 'Batterie',
    importance: 'medium',
    rules: [
      { condition: 'state >= 50', color: '#00FF00', behavior: 'solid' },
      { condition: 'state >= 10', color: '#FFFF00', behavior: 'solid' },
      { condition: 'state >= 1', color: '#FF0000', behavior: 'solid' },
      { condition: 'default', color: '#FF0000', behavior: 'pulse' },
    ],
  },
  {
    id: 'on_off',
    name: 'On/Off',
    importance: 'medium',
    rules: [
      { condition: 'state == "on"', color: '#00FF00', behavior: 'solid' },
      { condition: 'default', color: '#333333', behavior: 'solid' },
    ],
  },
  {
    id: 'unavailable_alert',
    name: 'Alerte indisponible',
    importance: 'high',
    rules: [
      { condition: 'unavailable', color: '#FF6600', behavior: 'blink_fast' },
      { condition: 'default', color: '#00FF00', behavior: 'solid' },
    ],
  },
  {
    id: 'temp_hot',
    name: 'Température chaude (équipement)',
    importance: 'medium',
    rules: [
      { condition: 'state >= 80', color: '#FF0000', behavior: 'pulse' },
      { condition: 'state >= 60', color: '#FF3300', behavior: 'solid' },
      { condition: 'state >= 45', color: '#FF8800', behavior: 'solid' },
      { condition: 'state >= 35', color: '#FFDD00', behavior: 'solid' },
      { condition: 'default', color: '#00FF00', behavior: 'solid' },
    ],
  },
  {
    id: 'temp_fridge',
    name: 'Réfrigérateur (°C)',
    importance: 'medium',
    rules: [
      { condition: 'state >= 15', color: '#FF0000', behavior: 'pulse' },
      { condition: 'state >= 12', color: '#FF6600', behavior: 'solid' },
      { condition: 'state >= 10', color: '#FFAA00', behavior: 'solid' },
      { condition: 'state >= 8', color: '#FFFF00', behavior: 'solid' },
      { condition: 'state >= 2', color: '#00FF00', behavior: 'solid' },
      { condition: 'state >= 0', color: '#00DDFF', behavior: 'solid' },
      { condition: 'default', color: '#0088FF', behavior: 'solid' },
    ],
  },
  {
    id: 'temp_freezer',
    name: 'Congélateur (°C)',
    importance: 'medium',
    rules: [
      { condition: 'state >= -10', color: '#FF0000', behavior: 'pulse' },
      { condition: 'state >= -15', color: '#FF6600', behavior: 'solid' },
      { condition: 'state >= -18', color: '#FFCC00', behavior: 'solid' },
      { condition: 'default', color: '#00FF00', behavior: 'solid' },
    ],
  },
  {
    id: 'temp_room',
    name: 'Pièce / confort (°C)',
    importance: 'medium',
    rules: [
      { condition: 'state >= 28', color: '#FF2200', behavior: 'solid' },
      { condition: 'state >= 26', color: '#FF8800', behavior: 'solid' },
      { condition: 'state >= 24', color: '#FFDD00', behavior: 'solid' },
      { condition: 'state >= 19', color: '#00FF00', behavior: 'solid' },
      { condition: 'state >= 16', color: '#00DDFF', behavior: 'solid' },
      { condition: 'default', color: '#0088FF', behavior: 'solid' },
    ],
  },
  {
    id: 'humidity_plant',
    name: 'Humidité sol / plante (%)',
    importance: 'medium',
    rules: [
      { condition: 'state < 20', color: '#FF0000', behavior: 'pulse' },
      { condition: 'state < 35', color: '#FF8800', behavior: 'solid' },
      { condition: 'state < 50', color: '#FFDD00', behavior: 'solid' },
      { condition: 'state < 70', color: '#00FF00', behavior: 'solid' },
      { condition: 'default', color: '#0088FF', behavior: 'solid' },
    ],
  },
  {
    id: 'humidity_room',
    name: 'Humidité maison (%)',
    importance: 'medium',
    rules: [
      { condition: 'state >= 70', color: '#CC2200', behavior: 'solid' },
      { condition: 'state >= 65', color: '#FF6600', behavior: 'solid' },
      { condition: 'state >= 60', color: '#FFCC00', behavior: 'solid' },
      { condition: 'state >= 35', color: '#00FF00', behavior: 'solid' },
      { condition: 'state >= 30', color: '#FFCC00', behavior: 'solid' },
      { condition: 'default', color: '#FF8800', behavior: 'solid' },
    ],
  },
  {
    id: 'power_instant',
    name: 'Puissance (W)',
    importance: 'medium',
    rules: [
      { condition: 'state >= 2000', color: '#FF0000', behavior: 'pulse' },
      { condition: 'state >= 1000', color: '#FF6600', behavior: 'solid' },
      { condition: 'state >= 200', color: '#FFCC00', behavior: 'solid' },
      { condition: 'state >= 50', color: '#88FF00', behavior: 'solid' },
      { condition: 'default', color: '#444444', behavior: 'solid' },
    ],
  },
  {
    id: 'energy_period',
    name: 'Énergie (kWh)',
    importance: 'medium',
    rules: [
      { condition: 'state >= 30', color: '#FF0000', behavior: 'solid' },
      { condition: 'state >= 15', color: '#FF8800', behavior: 'solid' },
      { condition: 'state >= 5', color: '#FFDD00', behavior: 'solid' },
      { condition: 'default', color: '#00CC00', behavior: 'solid' },
    ],
  },
  {
    id: 'air_pm25',
    name: 'PM2.5 (µg/m³)',
    importance: 'high',
    rules: [
      { condition: 'state >= 55', color: '#CC0000', behavior: 'solid' },
      { condition: 'state >= 35', color: '#FF8800', behavior: 'solid' },
      { condition: 'state >= 12', color: '#FFDD00', behavior: 'solid' },
      { condition: 'default', color: '#00CC00', behavior: 'solid' },
    ],
  },
  {
    id: 'air_pm10',
    name: 'PM10 (µg/m³)',
    importance: 'high',
    rules: [
      { condition: 'state >= 100', color: '#CC0000', behavior: 'solid' },
      { condition: 'state >= 50', color: '#FF8800', behavior: 'solid' },
      { condition: 'state >= 45', color: '#FFDD00', behavior: 'solid' },
      { condition: 'default', color: '#00CC00', behavior: 'solid' },
    ],
  },
  {
    id: 'air_co2',
    name: 'CO₂ (ppm)',
    importance: 'high',
    rules: [
      { condition: 'state >= 2000', color: '#FF0000', behavior: 'pulse' },
      { condition: 'state >= 1500', color: '#FF3300', behavior: 'solid' },
      { condition: 'state >= 1000', color: '#FF8800', behavior: 'solid' },
      { condition: 'state >= 800', color: '#FFDD00', behavior: 'solid' },
      { condition: 'default', color: '#00CC00', behavior: 'solid' },
    ],
  },
  {
    id: 'air_radon',
    name: 'Radon (Bq/m³)',
    importance: 'high',
    rules: [
      { condition: 'state >= 300', color: '#CC0000', behavior: 'pulse' },
      { condition: 'state >= 200', color: '#FF6600', behavior: 'solid' },
      { condition: 'state >= 100', color: '#FFCC00', behavior: 'solid' },
      { condition: 'default', color: '#00CC00', behavior: 'solid' },
    ],
  },
  {
    id: 'noise_db',
    name: 'Bruit (dB)',
    importance: 'medium',
    rules: [
      { condition: 'state >= 80', color: '#FF0000', behavior: 'solid' },
      { condition: 'state >= 70', color: '#FF8800', behavior: 'solid' },
      { condition: 'state >= 55', color: '#FFDD00', behavior: 'solid' },
      { condition: 'state >= 40', color: '#00FF00', behavior: 'solid' },
      { condition: 'default', color: '#0088CC', behavior: 'solid' },
    ],
  },
  {
    id: 'uv_index',
    name: 'Indice UV',
    importance: 'medium',
    rules: [
      { condition: 'state >= 11', color: '#AA00FF', behavior: 'pulse' },
      { condition: 'state >= 8', color: '#FF0000', behavior: 'solid' },
      { condition: 'state >= 6', color: '#FF8800', behavior: 'solid' },
      { condition: 'state >= 3', color: '#FFDD00', behavior: 'solid' },
      { condition: 'default', color: '#00CC44', behavior: 'solid' },
    ],
  },
];

// ——— Colonne 1 : liste des entités ———
function EntityListColumn({
  haUrl,
  haToken,
  haEmbedded,
  entities,
  entitySearch,
  setEntitySearch,
  loadEntities,
  entitiesLoading,
  entitiesError,
  onSelectEntity,
  selectedEntityId,
}) {
  const { t } = useTranslation();
  const filtered =
    entitySearch.trim()
      ? entities.filter(
          (e) =>
            (e.entity_id || '').toLowerCase().includes(entitySearch.toLowerCase()) ||
            (e.attributes?.friendly_name || '').toLowerCase().includes(entitySearch.toLowerCase())
        )
      : entities.slice(0, 100);

  return (
    <aside className="column column-entities">
      <h3>{t('entitiesColumn')}</h3>
      {haToken ? (
        <>
          <button
            type="button"
            className="add-rule"
            onClick={loadEntities}
            disabled={entitiesLoading}
          >
            {entitiesLoading ? '…' : t('loadEntities')}
          </button>
          {entitiesError && <p className="form-hint form-error">{entitiesError}</p>}
          {entities.length > 0 && (
            <>
              <input
                type="text"
                className="column-input"
                placeholder={t('entitySearchPlaceholder')}
                value={entitySearch}
                onChange={(e) => setEntitySearch(e.target.value)}
              />
              <ul className="entity-list">
                {filtered.slice(0, 50).map((e) => (
                  <li
                    key={e.entity_id}
                    className={`entity-list-item ${selectedEntityId === e.entity_id ? 'selected' : ''}`}
                    onClick={() => onSelectEntity(e.entity_id)}
                  >
                    {e.attributes?.friendly_name || e.entity_id}
                    <span className="entity-id">{e.entity_id}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : (
        <p className="hint">{haEmbedded ? t('noHaConfiguredEmbedded') : t('noHaConfigured')}</p>
      )}
    </aside>
  );
}

// ——— Colonne 2 : assignation + possibilités ———
function AssignmentColumn({
  selectedLeds,
  assignment,
  onSave,
  onChange,
  entities,
  removeRuleAt,
  moveRuleUp,
  moveRuleDown,
  ruleTemplates,
}) {
  const { t } = useTranslation();
  const [attrKey, setAttrKey] = useState('');
  const [templateId, setTemplateId] = useState('');
  const a = assignment || defaultAssignment();
  const templates = ruleTemplates && ruleTemplates.length > 0 ? ruleTemplates : DEFAULT_RULE_TEMPLATES;

  const selectedEntity = entities.find((e) => e?.entity_id === a.entity_id) || null;
  const attrKeys = selectedEntity
    ? Object.keys(selectedEntity.attributes || {})
        .filter((k) => typeof k === 'string' && k.length > 0 && k !== 'entity_id')
        .sort((x, y) => x.localeCompare(y))
    : [];

  useEffect(() => {
    setAttrKey('');
  }, [a.entity_id]);

  const addRuleWithCondition = useCallback(
    (condition) => {
      if (!condition) return;
      const baseColor = (a.rules && a.rules[0] && a.rules[0].color) || '#808080';
      const nextRules = [...(a.rules || []), { condition, color: baseColor, behavior: 'solid' }];
      onChange({ ...a, rules: nextRules });
    },
    [a, onChange]
  );

  return (
    <aside className="column column-assignment">
      <h3>{t('assignmentColumn')}</h3>
      <p className="hint">
        {t('selectedLeds')}: {selectedLeds.length}
      </p>
      <div className="form-group">
        <label>{t('entityId')}</label>
        <input
          type="text"
          value={a.entity_id}
          onChange={(e) => onChange({ ...a, entity_id: e.target.value })}
          placeholder="sensor.example"
        />
      </div>

      <div className="form-group">
        <label>{t('template')}</label>
        <select
          value={templateId}
          onChange={(e) => {
            const id = e.target.value;
            setTemplateId('');
            if (!id) return;
            const tmpl = templates.find((m) => m.id === id);
            if (tmpl) {
              onChange({
                ...a,
                importance: tmpl.importance,
                rules: (tmpl.rules || []).map((r) => ({ ...r })),
              });
            }
          }}
        >
          <option value="">{t('templatePlaceholder')}</option>
          {templates.map((tmpl) => (
            <option key={tmpl.id} value={tmpl.id}>
              {tmpl.name}
            </option>
          ))}
        </select>
      </div>

      {selectedEntity && (
        <div className="form-group">
          <label>{t('possibilities')}</label>
          <div className="possibilities">
            <button type="button" className="chip" onClick={() => addRuleWithCondition('default')}>
              default
            </button>
            <button type="button" className="chip" onClick={() => addRuleWithCondition('unavailable')}>
              unavailable
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => addRuleWithCondition(`state == ${selectedEntity.state}`)}
              title={t('stateNow')}
            >
              state == {String(selectedEntity.state)}
            </button>
            {!Number.isNaN(Number(selectedEntity.state)) && (
              <>
                <button
                  type="button"
                  className="chip"
                  onClick={() => addRuleWithCondition(`state <= ${selectedEntity.state}`)}
                >
                  state &lt;= {String(selectedEntity.state)}
                </button>
                <button
                  type="button"
                  className="chip"
                  onClick={() => addRuleWithCondition(`state >= ${selectedEntity.state}`)}
                >
                  state &gt;= {String(selectedEntity.state)}
                </button>
              </>
            )}
          </div>
          {attrKeys.length > 0 && (
            <>
              <div className="attr-row">
                <select value={attrKey} onChange={(e) => setAttrKey(e.target.value)}>
                  <option value="">{t('pickAttribute')}</option>
                  {attrKeys.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                {attrKey && (
                  <span className="attr-value">
                    {t('attrValue')}: {String(selectedEntity.attributes?.[attrKey])}
                  </span>
                )}
              </div>
              {attrKey && (
                <div className="possibilities">
                  <button
                    type="button"
                    className="chip"
                    onClick={() => addRuleWithCondition(`attribute.${attrKey}`)}
                  >
                    attribute.{attrKey}
                  </button>
                  <button
                    type="button"
                    className="chip"
                    onClick={() =>
                      addRuleWithCondition(
                        `attribute.${attrKey} == ${String(selectedEntity.attributes?.[attrKey])}`
                      )
                    }
                  >
                    attribute.{attrKey} == {String(selectedEntity.attributes?.[attrKey])}
                  </button>
                  {!Number.isNaN(Number(selectedEntity.attributes?.[attrKey])) && (
                    <>
                      <button
                        type="button"
                        className="chip"
                        onClick={() =>
                          addRuleWithCondition(
                            `attribute.${attrKey} <= ${String(selectedEntity.attributes?.[attrKey])}`
                          )
                        }
                      >
                        attribute.{attrKey} &lt;= {String(selectedEntity.attributes?.[attrKey])}
                      </button>
                      <button
                        type="button"
                        className="chip"
                        onClick={() =>
                          addRuleWithCondition(
                            `attribute.${attrKey} >= ${String(selectedEntity.attributes?.[attrKey])}`
                          )
                        }
                      >
                        attribute.{attrKey} &gt;= {String(selectedEntity.attributes?.[attrKey])}
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="form-group">
        <label>{t('importance')}</label>
        <select
          value={a.importance}
          onChange={(e) => onChange({ ...a, importance: e.target.value })}
        >
          <option value="low">{t('importanceLow')}</option>
          <option value="medium">{t('importanceMedium')}</option>
          <option value="high">{t('importanceHigh')}</option>
        </select>
      </div>
      <div className="form-group">
        <label>{t('rules')}</label>
        <p className="form-hint rule-order-hint">{t('ruleOrderHint')}</p>
        {(a.rules || []).map((rule, idx) => {
          const ruleCount = (a.rules || []).length;
          const ruleLabel =
            idx === 0
              ? t('ruleIf')
              : idx === ruleCount - 1
                ? t('ruleElse')
                : t('ruleElseIf');
          return (
            <div key={idx} className="rule-row">
              <span className="rule-label" title={t('ruleOrderHint')}>
                {ruleLabel}
              </span>
              <div className="rule-move">
                <button
                  type="button"
                  className="rule-move-btn"
                  onClick={() => moveRuleUp?.(idx)}
                  disabled={idx === 0}
                  title={t('moveRuleUp')}
                  aria-label={t('moveRuleUp')}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="rule-move-btn"
                  onClick={() => moveRuleDown?.(idx)}
                  disabled={idx === ruleCount - 1}
                  title={t('moveRuleDown')}
                  aria-label={t('moveRuleDown')}
                >
                  ↓
                </button>
              </div>
              <input
                type="text"
                value={rule.condition}
                onChange={(e) => {
                  const r = [...a.rules];
                  r[idx] = { ...rule, condition: e.target.value };
                  onChange({ ...a, rules: r });
                }}
                placeholder="default / state <= 10 / unavailable"
              />
              <input
                type="color"
                value={rule.color || '#000000'}
                onChange={(e) => {
                  const r = [...a.rules];
                  r[idx] = { ...rule, color: e.target.value };
                  onChange({ ...a, rules: r });
                }}
              />
              <select
                value={rule.behavior}
                onChange={(e) => {
                  const r = [...a.rules];
                  r[idx] = { ...rule, behavior: e.target.value };
                  onChange({ ...a, rules: r });
                }}
              >
                <option value="solid">{t('behaviorSolid')}</option>
                <option value="blink_fast">{t('behaviorBlinkFast')}</option>
                <option value="blink_slow">{t('behaviorBlinkSlow')}</option>
                <option value="pulse">{t('behaviorPulse')}</option>
                <option value="off">{t('behaviorOff')}</option>
              </select>
              {(a.rules || []).length > 1 && (
                <button
                  type="button"
                  className="rule-delete"
                  onClick={() => removeRuleAt(idx)}
                  title={t('deleteRule')}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          className="add-rule"
          onClick={() =>
            onChange({
              ...a,
              rules: [...(a.rules || []), { condition: 'default', color: '#808080', behavior: 'solid' }],
            })
          }
        >
          {t('addRule')}
        </button>
      </div>
      <button type="button" className="save-btn" onClick={() => onSave(a)}>
        {t('applyToSelected')}
      </button>
    </aside>
  );
}

// ——— Colonne 3 : panneaux ———
function LedGrid({
  numPanels,
  onNumPanelsChange,
  panelOptions,
  selectedLeds,
  onCellClick,
  previewColor,
  assignedColors,
  removeModePanel,
  onRemoveModeToggle,
  onClearPanel,
  onPanelOptionChange,
}) {
  const { t } = useTranslation();
  const rows = 8;
  const cols = 8;
  const panels = Array.from({ length: numPanels }, (_, p) => p);
  const opts = (panel, def = { flip_h: false, flip_v: false, layout: 'zigzag_h' }) =>
    panelOptions?.[panel] || def;
  const isCorner = (r, c) =>
    (r === 0 && c === 0) || (r === 0 && c === 7) || (r === 7 && c === 0) || (r === 7 && c === 7);

  return (
    <div className="column column-panels">
      <h3>{t('panelsColumn')}</h3>
      <div className="panels-count-row">
        <label>
          {t('panelsCount')}
          <select
            value={numPanels}
            onChange={(e) => onNumPanelsChange?.(Number(e.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>
      </div>
      <div className="grid-container">
        {panels.map((panel) => {
          const panelOpts = opts(panel);
          return (
            <div key={panel} className="panel">
              <div className="panel-label">Panel {panel}</div>
              <div
                className="led-grid"
                style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
              >
                {Array.from({ length: rows * cols }, (_, i) => {
                  const row = Math.floor(i / cols);
                  const col = i % cols;
                  const key = `${panel}-${row}-${col}`;
                  const isSelected = selectedLeds.some(
                    (l) => l.panel === panel && l.row === row && l.col === col
                  );
                  let color = '#333';
                  if (isSelected && previewColor) {
                    color = previewColor;
                  } else if (assignedColors && assignedColors.has(key)) {
                    color = assignedColors.get(key);
                  }
                  const isRemoveMode = removeModePanel === panel;
                  const cornerIndex =
                    isCorner(row, col) ? cellToIndex(row, col, panelOpts) + 1 : null;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`led-cell ${isRemoveMode ? 'remove-mode' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => onCellClick(panel, row, col)}
                      title={`${panel} ${row} ${col}${cornerIndex != null ? ` → #${cornerIndex}` : ''}`}
                    >
                      {cornerIndex != null && (
                        <span className="led-cell-index">{cornerIndex}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="panel-orientation">
                <button
                  type="button"
                  className={`panel-btn small ${panelOpts.flip_h ? 'active' : ''}`}
                  onClick={() =>
                    onPanelOptionChange(panel, 'flip_h', !panelOpts.flip_h)
                  }
                >
                  {t('flipH')}
                </button>
                <button
                  type="button"
                  className={`panel-btn small ${panelOpts.flip_v ? 'active' : ''}`}
                  onClick={() =>
                    onPanelOptionChange(panel, 'flip_v', !panelOpts.flip_v)
                  }
                >
                  {t('flipV')}
                </button>
                <button
                  type="button"
                  className={`panel-btn small ${panelOpts.layout === 'zigzag_h' ? 'active' : ''}`}
                  onClick={() => onPanelOptionChange(panel, 'layout', 'zigzag_h')}
                >
                  {t('sensH')}
                </button>
                <button
                  type="button"
                  className={`panel-btn small ${panelOpts.layout === 'zigzag_v' ? 'active' : ''}`}
                  onClick={() => onPanelOptionChange(panel, 'layout', 'zigzag_v')}
                >
                  {t('sensV')}
                </button>
              </div>
              <div className="panel-actions">
                <button
                  type="button"
                  className={`panel-btn ${removeModePanel === panel ? 'active' : ''}`}
                  onClick={() => onRemoveModeToggle(panel)}
                >
                  {t('removeOneCell')}
                </button>
                <button
                  type="button"
                  className="panel-btn danger"
                  onClick={() => {
                    if (window.confirm(t('clearPanelConfirm'))) onClearPanel(panel);
                  }}
                >
                  {t('clearPanel')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const defaultPanelOption = () => ({
  flip_h: false,
  flip_v: false,
  layout: 'zigzag_h',
});

export default function App() {
  const { t, i18n } = useTranslation();
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [numPanels, setNumPanels] = useState(1);
  const [panelOptions, setPanelOptions] = useState([
    defaultPanelOption(),
  ]);
  const [selectedLeds, setSelectedLeds] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [previewColor, setPreviewColor] = useState(null);
  const [haUrl, setHaUrl] = useState('');
  const [haToken, setHaToken] = useState('');
  const [haConfigPath, setHaConfigPath] = useState('led_panel_config.json');
  const [haFileBusy, setHaFileBusy] = useState(false);
  const [haFileError, setHaFileError] = useState(null);
  const [haFileInfo, setHaFileInfo] = useState(null);
  const [entities, setEntities] = useState([]);
  const [entitySearch, setEntitySearch] = useState('');
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [entitiesError, setEntitiesError] = useState(null);
  const [removeModePanel, setRemoveModePanel] = useState(null); // index or null
  const [ruleTemplates, setRuleTemplates] = useState([]); // chargé depuis templates.json
  const haEmbedded = isRunningInsideHomeAssistant();
  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const url = new URL('templates.json', window.location.href).href;
    let cancelled = false;
    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('templates.json not found'))))
      .then((data) => {
        if (cancelled || !mountedRef.current) return;
        setRuleTemplates(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled && mountedRef.current) setRuleTemplates([]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try {
      setHaUrl(localStorage.getItem(STORAGE_HA_URL) || '');
      setHaToken(localStorage.getItem(STORAGE_HA_TOKEN) || '');
      setHaConfigPath(localStorage.getItem(STORAGE_HA_CONFIG_PATH) || 'led_panel_config.json');
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!haEmbedded) return;
    const token = getHaTokenBestEffort();
    if (token) {
      // In HA we can use same-origin calls (no CORS) and reuse the current origin.
      // This also satisfies the UI requirement (URL + token) to enable entity loading.
      setHaUrl(window.location.origin);
      setHaToken(token);
    }
  }, [haEmbedded]);

  useEffect(() => {
    if (!haEmbedded) return;
    // Fallback: panel_custom wrapper can postMessage us the token.
    return listenForHaAuthMessage(({ token, origin }) => {
      setHaUrl(origin || window.location.origin);
      setHaToken(token);
    });
  }, [haEmbedded]);

  useEffect(() => {
    setPanelOptions((prev) => {
      const next = prev.slice(0, numPanels);
      while (next.length < numPanels) {
        next.push(defaultPanelOption());
      }
      return next;
    });
  }, [numPanels]);

  const loadEntities = useCallback(async () => {
    if (!haToken?.trim()) return;
    // Avec un token, on utilise l'URL sauvegardée ou l'origine courante (éditeur servi par HA).
    const url = haUrl?.trim() || (typeof window !== 'undefined' ? window.location.origin : '');
    if (!url) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setEntitiesLoading(true);
    setEntitiesError(null);
    try {
      const list = await fetchHaStates(url, haToken.trim(), ctrl.signal);
      if (!mountedRef.current) return;
      setEntities(Array.isArray(list) ? list : []);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      if (!mountedRef.current) return;
      const msg =
        err?.name === 'TypeError' && String(err?.message || '').toLowerCase().includes('fetch')
          ? t('connectionErrorCors')
          : (err?.message || t('connectionError'));
      setEntitiesError(msg);
      setEntities([]);
    } finally {
      if (mountedRef.current) setEntitiesLoading(false);
    }
  }, [haUrl, haToken, t]);

  const saveHaConnection = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_HA_URL, haUrl);
      localStorage.setItem(STORAGE_HA_TOKEN, haToken);
      localStorage.setItem(STORAGE_HA_CONFIG_PATH, haConfigPath);
    } catch (_) {}
  }, [haUrl, haToken, haConfigPath]);

  const haLoadConfigFile = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setHaFileBusy(true);
    setHaFileError(null);
    setHaFileInfo(null);
    try {
      const data = await haReadLedPanelConfig({ path: haConfigPath, signal: ctrl.signal });
      if (!mountedRef.current) return;
      if (!data || typeof data !== 'object') throw new Error('invalid_json');
      setConfig(data);
      const n = data.panels ?? 1;
      setNumPanels(n);
      const opts = data.panel_options;
      if (Array.isArray(opts) && opts.length >= n) {
        setPanelOptions(
          opts.slice(0, n).map((o) => ({
            flip_h: !!o.flip_h,
            flip_v: !!o.flip_v,
            layout: o.layout || 'zigzag_h',
          }))
        );
      } else {
        setPanelOptions(Array.from({ length: n }, () => defaultPanelOption()));
      }
      setHaFileInfo(t('importOk') || 'OK');
    } catch (err) {
      if (err?.name === 'AbortError') return;
      if (mountedRef.current) setHaFileError(err?.message || 'error');
    } finally {
      if (mountedRef.current) setHaFileBusy(false);
    }
  }, [haConfigPath, t]);

  const haSaveConfigFile = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setHaFileBusy(true);
    setHaFileError(null);
    setHaFileInfo(null);
    try {
      const payload = {
        ...config,
        panels: numPanels,
        panel_options: panelOptions.slice(0, numPanels).map((o) => ({
          flip_h: !!o.flip_h,
          flip_v: !!o.flip_v,
          layout: o.layout || 'zigzag_h',
        })),
      };
      await haWriteLedPanelConfig({ path: haConfigPath, data: payload, signal: ctrl.signal });
      if (!mountedRef.current) return;
      setHaFileInfo(t('saveOk') || 'OK');
    } catch (err) {
      if (err?.name === 'AbortError') return;
      if (mountedRef.current) setHaFileError(err?.message || 'error');
    } finally {
      if (mountedRef.current) setHaFileBusy(false);
    }
  }, [config, numPanels, panelOptions, haConfigPath, t]);

  const assignedColors = (() => {
    const map = new Map();
    for (const a of config.assignments || []) {
      const rules = a.rules || [];
      const defaultRule = rules.find((r) => r.condition === 'default') || rules[0] || null;
      const color = defaultRule?.color || '#666666';
      for (const led of a.leds || []) {
        map.set(`${led.panel}-${led.row}-${led.col}`, color);
      }
    }
    return map;
  })();

  useEffect(() => {
    if (currentAssignment?.rules?.length > 0) {
      setPreviewColor(currentAssignment.rules[0]?.color || '#00ff00');
    } else if (selectedLeds.length > 0) {
      setPreviewColor('#00ff00');
    } else {
      setPreviewColor(null);
    }
  }, [currentAssignment, selectedLeds.length]);

  const findAssignmentByLed = useCallback(
    (panel, row, col) => {
      for (const a of config.assignments || []) {
        for (const led of a.leds || []) {
          if (led.panel === panel && led.row === row && led.col === col) return a;
        }
      }
      return null;
    },
    [config.assignments]
  );

  const onCellClick = useCallback(
    (panel, row, col) => {
      // Mode suppression : retirer cette case de son assignation
      if (removeModePanel === panel) {
        const keyOf = (l) => `${l.panel}-${l.row}-${l.col}`;
        const key = `${panel}-${row}-${col}`;
        const assignment = findAssignmentByLed(panel, row, col);
        if (!assignment) return;
        setConfig((c) => {
          const next = (c.assignments || []).map((a) =>
            a.id === assignment.id
              ? { ...a, leds: (a.leds || []).filter((l) => keyOf(l) !== key) }
              : a
          ).filter((a) => (a.leds || []).length > 0);
          return { ...c, assignments: next };
        });
        if (currentAssignment?.id === assignment.id) {
          const remaining = (assignment.leds || []).filter((l) => keyOf(l) !== key);
          setCurrentAssignment(remaining.length > 0 ? { ...assignment, leds: remaining } : null);
          setSelectedLeds(remaining);
        }
        return;
      }
      // Clic sur une case déjà assignée → charger l'assignation pour édition (on ne remplace pas)
      const existing = findAssignmentByLed(panel, row, col);
      if (existing && (!currentAssignment || currentAssignment.id !== existing.id)) {
        setCurrentAssignment(existing);
        setSelectedLeds(existing.leds || []);
        return;
      }
      // Clic sur case non attribuée (ou même assignation) : toggle dans la sélection
      setSelectedLeds((prev) => {
        const idx = prev.findIndex((l) => l.panel === panel && l.row === row && l.col === col);
        if (idx >= 0) return prev.filter((_, i) => i !== idx);
        return [...prev, { panel, row, col }];
      });
    },
    [removeModePanel, findAssignmentByLed, currentAssignment]
  );

  const saveAssignment = useCallback(
    (a) => {
      const assignment = {
        id: a.id || `assignment_${Date.now()}`,
        label: a.label || a.entity_id || 'Assignment',
        leds: [...selectedLeds],
        importance: a.importance,
        brightness_base: a.brightness_base ?? 30,
        entity_id: a.entity_id,
        rules: a.rules || [],
      };
      setConfig((c) => ({
        ...c,
        panels: numPanels,
        assignments: [...c.assignments.filter((x) => x.id !== assignment.id), assignment],
      }));
      setSelectedLeds([]);
      setCurrentAssignment(null);
    },
    [selectedLeds, numPanels]
  );

  const removeRuleAt = useCallback(
    (idx) => {
      if (!currentAssignment?.rules || idx < 0 || idx >= currentAssignment.rules.length) return;
      const nextRules = currentAssignment.rules.filter((_, i) => i !== idx);
      if (nextRules.length === 0) return;
      setCurrentAssignment({ ...currentAssignment, rules: nextRules });
    },
    [currentAssignment]
  );

  const moveRuleUp = useCallback(
    (idx) => {
      if (!currentAssignment?.rules || idx <= 0 || idx >= currentAssignment.rules.length) return;
      const r = [...currentAssignment.rules];
      [r[idx - 1], r[idx]] = [r[idx], r[idx - 1]];
      setCurrentAssignment({ ...currentAssignment, rules: r });
    },
    [currentAssignment]
  );

  const moveRuleDown = useCallback(
    (idx) => {
      if (
        !currentAssignment?.rules ||
        idx < 0 ||
        idx >= currentAssignment.rules.length - 1
      )
        return;
      const r = [...currentAssignment.rules];
      [r[idx], r[idx + 1]] = [r[idx + 1], r[idx]];
      setCurrentAssignment({ ...currentAssignment, rules: r });
    },
    [currentAssignment]
  );

  const clearPanel = useCallback((panel) => {
    setConfig((c) => {
      const keyOf = (l) => `${l.panel}-${l.row}-${l.col}`;
      const panelKeys = new Set(
        Array.from({ length: 64 }, (_, i) => `${panel}-${Math.floor(i / 8)}-${i % 8}`)
      );
      const next = (c.assignments || [])
        .map((a) => ({
          ...a,
          leds: (a.leds || []).filter((l) => !panelKeys.has(keyOf(l))),
        }))
        .filter((a) => (a.leds || []).length > 0);
      return { ...c, assignments: next };
    });
    if (currentAssignment?.leds?.some((l) => l.panel === panel)) {
      const remaining = (currentAssignment.leds || []).filter((l) => l.panel !== panel);
      setCurrentAssignment({ ...currentAssignment, leds: remaining });
      setSelectedLeds(remaining);
    }
    setRemoveModePanel(null);
  }, [currentAssignment]);

  const onPanelOptionChange = useCallback((panel, key, value) => {
    setPanelOptions((prev) => {
      const next = prev.map((o, i) =>
        i === panel ? { ...o, [key]: value } : o
      );
      return next;
    });
  }, []);

  const exportJson = useCallback(() => {
    const payload = {
      ...config,
      panels: numPanels,
      panel_options: panelOptions.slice(0, numPanels).map((o) => ({
        flip_h: !!o.flip_h,
        flip_v: !!o.flip_v,
        layout: o.layout || 'zigzag_h',
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'led_panel_config.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }, [config, numPanels, panelOptions]);

  const importJson = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setConfig(data);
        const n = data.panels ?? 1;
        setNumPanels(n);
        const opts = data.panel_options;
        if (Array.isArray(opts) && opts.length >= n) {
          setPanelOptions(
            opts.slice(0, n).map((o) => ({
              flip_h: !!o.flip_h,
              flip_v: !!o.flip_v,
              layout: o.layout || 'zigzag_h',
            }))
          );
        } else {
          setPanelOptions(
            Array.from({ length: n }, () => defaultPanelOption())
          );
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  return (
    <div className="app">
      <header className="header">
        {/* Ligne 1 : titre */}
        <h1 className="header-title">{t('appTitle')}</h1>

        {/* Ligne 2 : Config JSON et accès HA + token + Enregistrer */}
        <div className="header-row header-row-2">
          <span className="ha-section-label">{t('configAndAccess')}:</span>
          <input
            type="password"
            placeholder={t('haToken')}
            value={haToken}
            onChange={(e) => setHaToken(e.target.value)}
            className="ha-input"
          />
          {!haEmbedded && (
            <input
              type="url"
              placeholder={t('haUrl')}
              value={haUrl}
              onChange={(e) => setHaUrl(e.target.value)}
              className="ha-input"
            />
          )}
          <button type="button" onClick={saveHaConnection} disabled={haFileBusy}>
            {t('saveConnection')}
          </button>
        </div>

        {/* Ligne 3 : note HA détecté */}
        {haEmbedded && (
          <div className="header-row header-row-3 hint">
            {haToken ? t('haDetected') : t('haDetectedNoToken')}
          </div>
        )}

        {/* Ligne 4 : chemin JSON + Charger + Sauvegarder */}
        <div className="header-row header-row-4">
          <input
            type="text"
            placeholder={t('configPath')}
            value={haConfigPath}
            onChange={(e) => setHaConfigPath(e.target.value)}
            className="ha-input"
          />
          <button type="button" onClick={haLoadConfigFile} disabled={haFileBusy}>
            {haFileBusy ? '…' : t('loadFromHa')}
          </button>
          <button type="button" onClick={haSaveConfigFile} disabled={haFileBusy}>
            {haFileBusy ? '…' : t('saveToHa')}
          </button>
        </div>
        {haFileError && <p className="form-hint form-error">{haFileError}</p>}
        {haFileInfo && <p className="form-hint">{haFileInfo}</p>}

        {/* Ligne 5 : Exporter, Importer, langue */}
        <div className="header-row header-row-5">
          <button type="button" onClick={exportJson}>
            {t('export')}
          </button>
          <label className="import-btn">
            {t('import')}
            <input type="file" accept=".json" onChange={importJson} hidden />
          </label>
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            <option value="en">EN</option>
            <option value="fr">FR</option>
          </select>
        </div>
      </header>
      <main className="main three-cols">
        <EntityListColumn
          haUrl={haUrl}
          haToken={haToken}
          haEmbedded={haEmbedded}
          entities={entities}
          entitySearch={entitySearch}
          setEntitySearch={setEntitySearch}
          loadEntities={loadEntities}
          entitiesLoading={entitiesLoading}
          entitiesError={entitiesError}
          onSelectEntity={(entity_id) =>
            setCurrentAssignment((prev) => ({ ...(prev || defaultAssignment()), entity_id }))
          }
          selectedEntityId={currentAssignment?.entity_id}
        />
        <AssignmentColumn
          selectedLeds={selectedLeds}
          assignment={currentAssignment}
          onSave={saveAssignment}
          onChange={setCurrentAssignment}
          entities={entities}
          removeRuleAt={removeRuleAt}
          moveRuleUp={moveRuleUp}
          moveRuleDown={moveRuleDown}
          ruleTemplates={ruleTemplates}
        />
        <LedGrid
          numPanels={numPanels}
          onNumPanelsChange={setNumPanels}
          panelOptions={panelOptions}
          selectedLeds={selectedLeds}
          onCellClick={onCellClick}
          previewColor={previewColor}
          assignedColors={assignedColors}
          removeModePanel={removeModePanel}
          onRemoveModeToggle={(panel) =>
            setRemoveModePanel((p) => (p === panel ? null : panel))
          }
          onClearPanel={clearPanel}
          onPanelOptionChange={onPanelOptionChange}
        />
      </main>
    </div>
  );
}
