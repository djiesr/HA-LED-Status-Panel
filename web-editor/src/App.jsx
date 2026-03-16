import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';

const STORAGE_HA_URL = 'led_panel_ha_url';
const STORAGE_HA_TOKEN = 'led_panel_ha_token';

const DEFAULT_CONFIG = {
  panels: 1,
  panel_layout: 'zigzag',
  assignments: [],
};

async function fetchHaStates(haUrl, haToken) {
  const base = haUrl.replace(/\/$/, '');
  const token = String(haToken || '').trim().replace(/^Bearer\s+/i, '');
  const res = await fetch(`${base}/api/states`, {
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

// ——— Colonne 1 : liste des entités ———
function EntityListColumn({
  haUrl,
  haToken,
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
      {haUrl && haToken ? (
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
        <p className="hint">{t('noHaConfigured')}</p>
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
}) {
  const { t } = useTranslation();
  const [attrKey, setAttrKey] = useState('');
  const a = assignment || defaultAssignment();

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
        {(a.rules || []).map((rule, idx) => (
          <div key={idx} className="rule-row">
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
        ))}
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
  selectedLeds,
  onCellClick,
  previewColor,
  assignedColors,
  removeModePanel,
  onRemoveModeToggle,
  onClearPanel,
}) {
  const { t } = useTranslation();
  const rows = 8;
  const cols = 8;
  const panels = Array.from({ length: numPanels }, (_, p) => p);

  return (
    <div className="column column-panels">
      <h3>{t('panelsColumn')}</h3>
      <div className="grid-container">
        {panels.map((panel) => (
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
                return (
                  <button
                    key={key}
                    type="button"
                    className={`led-cell ${isRemoveMode ? 'remove-mode' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => onCellClick(panel, row, col)}
                    title={`${panel} ${row} ${col}`}
                  />
                );
              })}
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
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [numPanels, setNumPanels] = useState(1);
  const [selectedLeds, setSelectedLeds] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [previewColor, setPreviewColor] = useState(null);
  const [haUrl, setHaUrl] = useState('');
  const [haToken, setHaToken] = useState('');
  const [entities, setEntities] = useState([]);
  const [entitySearch, setEntitySearch] = useState('');
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [entitiesError, setEntitiesError] = useState(null);
  const [removeModePanel, setRemoveModePanel] = useState(null); // index or null

  useEffect(() => {
    try {
      setHaUrl(localStorage.getItem(STORAGE_HA_URL) || '');
      setHaToken(localStorage.getItem(STORAGE_HA_TOKEN) || '');
    } catch (_) {}
  }, []);

  const loadEntities = useCallback(async () => {
    if (!haUrl?.trim() || !haToken?.trim()) return;
    setEntitiesLoading(true);
    setEntitiesError(null);
    try {
      const list = await fetchHaStates(haUrl.trim(), haToken.trim());
      setEntities(Array.isArray(list) ? list : []);
    } catch (err) {
      const msg =
        err?.name === 'TypeError' && String(err?.message || '').toLowerCase().includes('fetch')
          ? t('connectionErrorCors')
          : (err?.message || t('connectionError'));
      setEntitiesError(msg);
      setEntities([]);
    } finally {
      setEntitiesLoading(false);
    }
  }, [haUrl, haToken, t]);

  const saveHaConnection = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_HA_URL, haUrl);
      localStorage.setItem(STORAGE_HA_TOKEN, haToken);
    } catch (_) {}
  }, [haUrl, haToken]);

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

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify({ ...config, panels: numPanels }, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'led_panel_config.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }, [config, numPanels]);

  const importJson = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setConfig(data);
        setNumPanels(data.panels ?? 1);
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
        <h1>{t('appTitle')}</h1>
        <details className="ha-connection">
          <summary>{t('connectHa')}</summary>
          <div className="ha-fields">
            <input
              type="url"
              placeholder={t('haUrl')}
              value={haUrl}
              onChange={(e) => setHaUrl(e.target.value)}
              className="ha-input"
            />
            <input
              type="password"
              placeholder={t('haToken')}
              value={haToken}
              onChange={(e) => setHaToken(e.target.value)}
              className="ha-input"
            />
            <button type="button" onClick={saveHaConnection}>
              {t('saveConnection')}
            </button>
          </div>
        </details>
        <div className="header-actions">
          <label>
            {t('panels')}
            <select value={numPanels} onChange={(e) => setNumPanels(Number(e.target.value))}>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </label>
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
        />
        <LedGrid
          numPanels={numPanels}
          selectedLeds={selectedLeds}
          onCellClick={onCellClick}
          previewColor={previewColor}
          assignedColors={assignedColors}
          removeModePanel={removeModePanel}
          onRemoveModeToggle={(panel) =>
            setRemoveModePanel((p) => (p === panel ? null : panel))
          }
          onClearPanel={clearPanel}
        />
      </main>
    </div>
  );
}
