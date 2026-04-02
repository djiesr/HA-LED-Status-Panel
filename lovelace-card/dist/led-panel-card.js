const e=globalThis,t=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),s=new WeakMap;let o=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const i=this.t;if(t&&void 0===e){const t=void 0!==i&&1===i.length;t&&(e=s.get(i)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&s.set(i,e))}return e}toString(){return this.cssText}};const r=(e,...t)=>{const s=1===e.length?e[0]:t.reduce((t,i,s)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[s+1],e[0]);return new o(s,e,i)},n=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new o("string"==typeof e?e:e+"",void 0,i))(t)})(e):e,{is:a,defineProperty:l,getOwnPropertyDescriptor:d,getOwnPropertyNames:c,getOwnPropertySymbols:h,getPrototypeOf:p}=Object,u=globalThis,g=u.trustedTypes,f=g?g.emptyScript:"",v=u.reactiveElementPolyfillSupport,b=(e,t)=>e,_={toAttribute(e,t){switch(t){case Boolean:e=e?f:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},m=(e,t)=>!a(e,t),$={attribute:!0,type:String,converter:_,reflect:!1,useDefault:!1,hasChanged:m};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let y=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=$){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(e,i,t);void 0!==s&&l(this.prototype,e,s)}}static getPropertyDescriptor(e,t,i){const{get:s,set:o}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:s,set(t){const r=s?.call(this);o?.call(this,t),this.requestUpdate(e,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??$}static _$Ei(){if(this.hasOwnProperty(b("elementProperties")))return;const e=p(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(b("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(b("properties"))){const e=this.properties,t=[...c(e),...h(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((i,s)=>{if(t)i.adoptedStyleSheets=s.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const t of s){const s=document.createElement("style"),o=e.litNonce;void 0!==o&&s.setAttribute("nonce",o),s.textContent=t.cssText,i.appendChild(s)}})(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,i);if(void 0!==s&&!0===i.reflect){const o=(void 0!==i.converter?.toAttribute?i.converter:_).toAttribute(t,i.type);this._$Em=e,null==o?this.removeAttribute(s):this.setAttribute(s,o),this._$Em=null}}_$AK(e,t){const i=this.constructor,s=i._$Eh.get(e);if(void 0!==s&&this._$Em!==s){const e=i.getPropertyOptions(s),o="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:_;this._$Em=s;const r=o.fromAttribute(t,e.type);this[s]=r??this._$Ej?.get(s)??r,this._$Em=null}}requestUpdate(e,t,i,s=!1,o){if(void 0!==e){const r=this.constructor;if(!1===s&&(o=this[e]),i??=r.getPropertyOptions(e),!((i.hasChanged??m)(o,t)||i.useDefault&&i.reflect&&o===this._$Ej?.get(e)&&!this.hasAttribute(r._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:s,wrapped:o},r){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,r??t??this[e]),!0!==o||void 0!==r)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===s&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,s=this[t];!0!==e||this._$AL.has(t)||void 0===s||this.C(t,void 0,i,s)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};y.elementStyles=[],y.shadowRootOptions={mode:"open"},y[b("elementProperties")]=new Map,y[b("finalized")]=new Map,v?.({ReactiveElement:y}),(u.reactiveElementVersions??=[]).push("2.1.2");const x=globalThis,w=e=>e,S=x.trustedTypes,C=S?S.createPolicy("lit-html",{createHTML:e=>e}):void 0,E="$lit$",A=`lit$${Math.random().toFixed(9).slice(2)}$`,k="?"+A,M=`<${k}>`,O=document,P=()=>O.createComment(""),L=e=>null===e||"object"!=typeof e&&"function"!=typeof e,N=Array.isArray,z="[ \t\n\f\r]",R=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,D=/-->/g,T=/>/g,U=RegExp(`>|${z}(?:([^\\s"'>=/]+)(${z}*=${z}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),H=/'/g,j=/"/g,I=/^(?:script|style|textarea|title)$/i,F=(e=>(t,...i)=>({_$litType$:e,strings:t,values:i}))(1),B=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),q=new WeakMap,J=O.createTreeWalker(O,129);function V(e,t){if(!N(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==C?C.createHTML(t):t}const K=(e,t)=>{const i=e.length-1,s=[];let o,r=2===t?"<svg>":3===t?"<math>":"",n=R;for(let t=0;t<i;t++){const i=e[t];let a,l,d=-1,c=0;for(;c<i.length&&(n.lastIndex=c,l=n.exec(i),null!==l);)c=n.lastIndex,n===R?"!--"===l[1]?n=D:void 0!==l[1]?n=T:void 0!==l[2]?(I.test(l[2])&&(o=RegExp("</"+l[2],"g")),n=U):void 0!==l[3]&&(n=U):n===U?">"===l[0]?(n=o??R,d=-1):void 0===l[1]?d=-2:(d=n.lastIndex-l[2].length,a=l[1],n=void 0===l[3]?U:'"'===l[3]?j:H):n===j||n===H?n=U:n===D||n===T?n=R:(n=U,o=void 0);const h=n===U&&e[t+1].startsWith("/>")?" ":"";r+=n===R?i+M:d>=0?(s.push(a),i.slice(0,d)+E+i.slice(d)+A+h):i+A+(-2===d?t:h)}return[V(e,r+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),s]};class Z{constructor({strings:e,_$litType$:t},i){let s;this.parts=[];let o=0,r=0;const n=e.length-1,a=this.parts,[l,d]=K(e,t);if(this.el=Z.createElement(l,i),J.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(s=J.nextNode())&&a.length<n;){if(1===s.nodeType){if(s.hasAttributes())for(const e of s.getAttributeNames())if(e.endsWith(E)){const t=d[r++],i=s.getAttribute(e).split(A),n=/([.?@])?(.*)/.exec(t);a.push({type:1,index:o,name:n[2],strings:i,ctor:"."===n[1]?ee:"?"===n[1]?te:"@"===n[1]?ie:Y}),s.removeAttribute(e)}else e.startsWith(A)&&(a.push({type:6,index:o}),s.removeAttribute(e));if(I.test(s.tagName)){const e=s.textContent.split(A),t=e.length-1;if(t>0){s.textContent=S?S.emptyScript:"";for(let i=0;i<t;i++)s.append(e[i],P()),J.nextNode(),a.push({type:2,index:++o});s.append(e[t],P())}}}else if(8===s.nodeType)if(s.data===k)a.push({type:2,index:o});else{let e=-1;for(;-1!==(e=s.data.indexOf(A,e+1));)a.push({type:7,index:o}),e+=A.length-1}o++}}static createElement(e,t){const i=O.createElement("template");return i.innerHTML=e,i}}function G(e,t,i=e,s){if(t===B)return t;let o=void 0!==s?i._$Co?.[s]:i._$Cl;const r=L(t)?void 0:t._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(e),o._$AT(e,i,s)),void 0!==s?(i._$Co??=[])[s]=o:i._$Cl=o),void 0!==o&&(t=G(e,o._$AS(e,t.values),o,s)),t}class Q{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,s=(e?.creationScope??O).importNode(t,!0);J.currentNode=s;let o=J.nextNode(),r=0,n=0,a=i[0];for(;void 0!==a;){if(r===a.index){let t;2===a.type?t=new X(o,o.nextSibling,this,e):1===a.type?t=new a.ctor(o,a.name,a.strings,this,e):6===a.type&&(t=new se(o,this,e)),this._$AV.push(t),a=i[++n]}r!==a?.index&&(o=J.nextNode(),r++)}return J.currentNode=O,s}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,s){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=G(this,e,t),L(e)?e===W||null==e||""===e?(this._$AH!==W&&this._$AR(),this._$AH=W):e!==this._$AH&&e!==B&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>N(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==W&&L(this._$AH)?this._$AA.nextSibling.data=e:this.T(O.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,s="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=Z.createElement(V(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(t);else{const e=new Q(s,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=q.get(e.strings);return void 0===t&&q.set(e.strings,t=new Z(e)),t}k(e){N(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,s=0;for(const o of e)s===t.length?t.push(i=new X(this.O(P()),this.O(P()),this,this.options)):i=t[s],i._$AI(o),s++;s<t.length&&(this._$AR(i&&i._$AB.nextSibling,s),t.length=s)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=w(e).nextSibling;w(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class Y{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,s,o){this.type=1,this._$AH=W,this._$AN=void 0,this.element=e,this.name=t,this._$AM=s,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=W}_$AI(e,t=this,i,s){const o=this.strings;let r=!1;if(void 0===o)e=G(this,e,t,0),r=!L(e)||e!==this._$AH&&e!==B,r&&(this._$AH=e);else{const s=e;let n,a;for(e=o[0],n=0;n<o.length-1;n++)a=G(this,s[i+n],t,n),a===B&&(a=this._$AH[n]),r||=!L(a)||a!==this._$AH[n],a===W?e=W:e!==W&&(e+=(a??"")+o[n+1]),this._$AH[n]=a}r&&!s&&this.j(e)}j(e){e===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class ee extends Y{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===W?void 0:e}}class te extends Y{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==W)}}class ie extends Y{constructor(e,t,i,s,o){super(e,t,i,s,o),this.type=5}_$AI(e,t=this){if((e=G(this,e,t,0)??W)===B)return;const i=this._$AH,s=e===W&&i!==W||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,o=e!==W&&(i===W||s);s&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class se{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){G(this,e)}}const oe=x.litHtmlPolyfillSupport;oe?.(Z,X),(x.litHtmlVersions??=[]).push("3.3.2");const re=globalThis;class ne extends y{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const s=i?.renderBefore??t;let o=s._$litPart$;if(void 0===o){const e=i?.renderBefore??null;s._$litPart$=o=new X(t.insertBefore(P(),e),e,void 0,i??{})}return o._$AI(e),o})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return B}}ne._$litElement$=!0,ne.finalized=!0,re.litElementHydrateSupport?.({LitElement:ne});const ae=re.litElementPolyfillSupport;function le(e){return e?.auth?.data?.access_token||""}function de(e){return{Authorization:`Bearer ${le(e)}`,"Content-Type":"application/json"}}async function ce(e){const t=await e.text();if(!e.ok)try{const i=JSON.parse(t),s=i.message||i.error||JSON.stringify(i);throw new Error(`HTTP ${e.status} — ${s}`)}catch(t){if(t.message.startsWith("HTTP "))throw t;throw new Error(`HTTP ${e.status} (réponse non-JSON). L'intégration est-elle chargée et HA redémarré ?`)}try{return JSON.parse(t)}catch{throw new Error(`Réponse invalide (non-JSON) : ${t.slice(0,120)}`)}}ae?.({LitElement:ne}),(re.litElementVersions??=[]).push("4.2.2");const he={fr:{"card.title":"Panneau LED","card.loading":"Chargement…","card.reload":"Recharger","card.live":"⬤ Live","card.live.on":"Mode live activé","card.live.off":"Mode live désactivé","card.empty":"Aucune configuration chargée.","card.hint":"Cliquez sur les LEDs pour les sélectionner, puis « Configurer »","card.error.panel":"Panneau introuvable","card.error.config":"Erreur lecture config","card.error.network":"Erreur réseau","card.panel.label":"Panneau","sel.leds":"LED sélectionnée","sel.leds.plural":"LEDs sélectionnées","sel.clear":"✕ Désélectionner","sel.configure":"⚙ Configurer","save.saving":"Sauvegarde…","save.reloading":"Rechargement…","save.saved":"Sauvegardé et rechargé ✓","save.saved.noreload":"Sauvegardé ✓ (rechargement manuel requis)","save.error":"Erreur sauvegarde","dlg.new":"Nouvelle assignation","dlg.edit":"Modifier assignation","dlg.entity":"Entité","dlg.entity.ph":"Chercher une entité… (ex: sensor.batterie)","dlg.importance":"Importance / Luminosité","dlg.imp.low":"Faible (15%)","dlg.imp.medium":"Moyenne (30%)","dlg.imp.high":"Haute (100%)","dlg.leds":"LEDs assignées","dlg.cancel":"Annuler","dlg.save":"Sauvegarder","dlg.saving":"Sauvegarde…","dlg.delete":"Supprimer","dlg.state":"État","rules.title":"Règles (première correspondance)","rules.add":"+ Ajouter règle","rules.template":"Appliquer un modèle…","rules.if":"SI","rules.elif":"SINON SI","rules.else":"SINON","beh.solid":"Continu","beh.blink_fast":"Clignotement rapide","beh.blink_slow":"Clignotement lent","beh.pulse":"Pulsation","beh.off":"Éteint","tpl.batterie":"Batterie","tpl.on_off":"On/Off","tpl.unavailable":"Alerte indisponible","editor.panel_code":"Code du panneau (entity_id de la lumière ESPHome)","editor.panel_code.ph":"light.led_status_panel","editor.panel_code.h":"Ex: light.bureau_led_status_panel","editor.config_path":"Chemin du fichier de config (optionnel)","editor.config_path.h":"Relatif au dossier config HA. Laissez vide pour utiliser le chemin enregistré dans l'intégration.","editor.title":"Titre de la carte (optionnel)","editor.title.ph":"Panneau LED"},en:{"card.title":"LED Panel","card.loading":"Loading…","card.reload":"Reload","card.live":"⬤ Live","card.live.on":"Live mode enabled","card.live.off":"Live mode disabled","card.empty":"No configuration loaded.","card.hint":'Click LEDs to select them, then "Configure"',"card.error.panel":"Panel not found","card.error.config":"Error reading config","card.error.network":"Network error","card.panel.label":"Panel","sel.leds":"LED selected","sel.leds.plural":"LEDs selected","sel.clear":"✕ Deselect","sel.configure":"⚙ Configure","save.saving":"Saving…","save.reloading":"Reloading…","save.saved":"Saved and reloaded ✓","save.saved.noreload":"Saved ✓ (manual reload required)","save.error":"Save error","dlg.new":"New assignment","dlg.edit":"Edit assignment","dlg.entity":"Entity","dlg.entity.ph":"Search an entity… (e.g. sensor.battery)","dlg.importance":"Importance / Brightness","dlg.imp.low":"Low (15%)","dlg.imp.medium":"Medium (30%)","dlg.imp.high":"High (100%)","dlg.leds":"Assigned LEDs","dlg.cancel":"Cancel","dlg.save":"Save","dlg.saving":"Saving…","dlg.delete":"Delete","dlg.state":"State","rules.title":"Rules (first match wins)","rules.add":"+ Add rule","rules.template":"Apply a template…","rules.if":"IF","rules.elif":"ELSE IF","rules.else":"ELSE","beh.solid":"Solid","beh.blink_fast":"Fast blink","beh.blink_slow":"Slow blink","beh.pulse":"Pulse","beh.off":"Off","tpl.batterie":"Battery","tpl.on_off":"On/Off","tpl.unavailable":"Unavailable alert","editor.panel_code":"Panel code (ESPHome light entity_id)","editor.panel_code.ph":"light.led_status_panel","editor.panel_code.h":"E.g. light.office_led_status_panel","editor.config_path":"Config file path (optional)","editor.config_path.h":"Relative to HA config folder. Leave empty to use the path stored in the integration.","editor.title":"Card title (optional)","editor.title.ph":"LED Panel"}};function pe(e){const t=(e?.locale?.language||navigator.language||"en").toLowerCase().split("-")[0],i=he[t]||he.en;return e=>i[e]??he.en[e]??e}function ue(e){const t=new Map;for(const i of e||[])for(const e of i.leds||[]){const s=`${e.panel}-${e.row}-${e.col}`;t.set(s,i)}return t}const ge={low:15,medium:30,high:100},fe=[{id:"batterie",name:"Batterie",importance:"medium",rules:[{condition:"state >= 50",color:"#00FF00",behavior:"solid"},{condition:"state >= 10",color:"#FFFF00",behavior:"solid"},{condition:"state >= 1",color:"#FF0000",behavior:"solid"},{condition:"default",color:"#FF0000",behavior:"pulse"}]},{id:"on_off",name:"On/Off",importance:"medium",rules:[{condition:"state == on",color:"#00FF00",behavior:"solid"},{condition:"default",color:"#333333",behavior:"solid"}]},{id:"unavailable_alert",name:"Alerte indisponible",importance:"high",rules:[{condition:"unavailable",color:"#FF6600",behavior:"blink_fast"},{condition:"default",color:"#00FF00",behavior:"solid"}]}];function ve(e,t){const i=Math.max(0,Math.min(100,t))/100,s=parseInt(e.slice(1,3),16),o=parseInt(e.slice(3,5),16),r=parseInt(e.slice(5,7),16);return`rgb(${Math.round(s*i)},${Math.round(o*i)},${Math.round(r*i)})`}function be(e){const t=e.rules||[],i=t.find(e=>"default"===e.condition)||t[0];if(!i||"off"===i.behavior)return"#1a1a1a";const s=ge[e.importance]??30;return ve(i.color||"#ffffff",s)}function _e(e,t){if(!e||"off"===e.behavior)return"#1a1a1a";const i=ge[t]??30;return ve(e.color||"#ffffff",i)}function me(e){if(null==e)return null;if("number"==typeof e)return e;const t=String(e).trim();if(""===t)return null;const i=parseFloat(t);return isNaN(i)?null:i}function $e(e,t,i){i=(i||"").trim();const s=me(e),o=me(i);if(null!==s&&null!==o)return"=="===t?s===o:"!="===t?s!==o:"<"===t?s<o:"<="===t?s<=o:">"===t?s>o:">="===t&&s>=o;const r=null==e?"":String(e).trim();return"=="===t?r===i:"!="===t&&r!==i}const ye=["<=",">=","==","!=","<",">","="];function xe(e,t){const i=e.entity_id;if(!i)return null;const s=t[i];return function(e,t,i){for(const s of i||[]){const i=s.condition||"";if("unavailable"===i&&"unavailable"===e)return s;if("default"===i)return s;if("unavailable"===e)continue;if(i.startsWith("attribute.")){const e=i.slice(10).trim();let o=!1;for(const i of ye)if(e.includes(i)){const[r,n]=e.split(i,2),a=r.trim(),l=n.trim();if(!a)break;if(!(a in(t||{})))break;const d="="===i?"==":i;if($e((t||{})[a],d,l))return s;o=!0;break}if(!o){const i=e.trim();if(i&&null!=(t||{})[i])return s}continue}let o=i.trim();o.startsWith("state")&&(o=o.slice(5).trim());for(const t of ye)if(o.includes(t)){const[,i]=o.split(t,2);if($e(e,"="===t?"==":t,i.trim()))return s;break}}return null}(s?s.state:"unavailable",s&&s.attributes||{},e.rules||[])}class we extends ne{static properties={panel:{type:Number},row:{type:Number},col:{type:Number},color:{type:String},behavior:{type:String,reflect:!0},selected:{type:Boolean,reflect:!0},dimmed:{type:Boolean,reflect:!0},tooltip:{type:String}};static styles=r`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      /* Carré fixe */
      width: 36px;
      height: 36px;
      background: #111;
      border: 1px solid #222;
      box-sizing: border-box;
    }
    button {
      /* Rond centré dans le carré */
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      padding: 0;
      background: var(--led-color, #1e1e1e);
      box-shadow: 0 0 0 1px #333;
      transition: box-shadow 0.15s, filter 0.15s;
      box-sizing: border-box;
    }
    button:hover {
      box-shadow: 0 0 6px 2px var(--led-color, #555), 0 0 0 1px #666;
      filter: brightness(1.5);
    }
    :host([selected]) button {
      box-shadow: 0 0 0 2px #fff;
    }
    :host([dimmed]) button {
      opacity: 0.55;
    }
    /* Behavior animations */
    :host([behavior="blink_fast"]) button {
      animation: blink 0.5s step-end infinite;
    }
    :host([behavior="blink_slow"]) button {
      animation: blink 2s step-end infinite;
    }
    :host([behavior="pulse"]) button {
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.05; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.2; }
      50%       { opacity: 1;   }
    }
  `;render(){const e=this.tooltip?this.tooltip:`P${this.panel+1} · R${this.row+1} · C${this.col+1}`;return F`
      <button
        style="--led-color: ${this.color||"#1a1a1a"}"
        title=${e}
        @click=${this._onClick}
      ></button>
    `}_onClick(){this.dispatchEvent(new CustomEvent("cell-click",{detail:{panel:this.panel,row:this.row,col:this.col},bubbles:!0,composed:!0}))}}customElements.define("led-cell",we);class Se extends ne{static properties={panel:{type:Number},ledMap:{type:Object},liveColors:{type:Object},getColor:{type:Object},label:{type:String},selection:{type:Object},tooltipMap:{type:Object}};static styles=r`
    :host {
      display: block;
    }
    .panel-label {
      font-size: 0.75rem;
      color: var(--secondary-text-color, #888);
      margin-bottom: 4px;
      text-align: center;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(8, 36px);
      grid-template-rows: repeat(8, 36px);
      gap: 0;
      background: #111;
      border: 1px solid #2a2a2a;
      border-radius: 6px;
      padding: 4px;
      width: fit-content;
    }
  `;render(){const e=[];for(let t=0;t<8;t++)for(let i=0;i<8;i++){const s=`${this.panel}-${t}-${i}`,o=this.ledMap?.get(s),r=this.liveColors?.get(s);let n="#1a1a1a",a="solid",l=!1;r?(n=r.color,a=r.behavior||"solid"):o&&this.getColor&&(n=this.getColor(o),l=!0);const d=this.selection?.has(s)||!1,c=this.tooltipMap?.get(s)||"";e.push(F`
          <led-cell
            .panel=${this.panel}
            .row=${t}
            .col=${i}
            .color=${n}
            .behavior=${a}
            .tooltip=${c}
            ?dimmed=${l}
            ?selected=${d}
          ></led-cell>
        `)}return F`
      ${this.label?F`<div class="panel-label">${this.label}</div>`:""}
      <div class="grid">${e}</div>
    `}}customElements.define("led-grid",Se);class Ce extends ne{static properties={value:{type:String},hass:{attribute:!1}};static styles=r`
    select {
      background: var(--card-background-color, #1e1e1e);
      color: var(--primary-text-color, #e0e0e0);
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      padding: 4px 6px;
      font-size: 0.85rem;
      cursor: pointer;
      width: 100%;
    }
  `;render(){const e=pe(this.hass);return F`
      <select @change=${this._onChange}>
        ${["solid","blink_fast","blink_slow","pulse","off"].map(t=>F`
          <option value=${t} ?selected=${this.value===t}>${e(`beh.${t}`)}</option>
        `)}
      </select>
    `}_onChange(e){this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:e.target.value},bubbles:!0,composed:!0}))}}customElements.define("behavior-picker",Ce);class Ee extends ne{static properties={rule:{type:Object},label:{type:String},isFirst:{type:Boolean},isLast:{type:Boolean},isOnly:{type:Boolean},chips:{type:Array},hass:{attribute:!1}};static styles=r`
    :host { display: block; }

    .row {
      display: grid;
      grid-template-columns: 60px 1fr auto auto auto auto;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
    }

    .label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary-color, #03a9f4);
      text-align: right;
      padding-right: 4px;
      white-space: nowrap;
    }

    .condition-wrap {
      display: flex;
      flex-direction: column;
      gap: 3px;
      grid-column: 2;
    }

    input[type="text"] {
      width: 100%;
      background: var(--secondary-background-color, #1e1e1e);
      color: var(--primary-text-color, #e0e0e0);
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      padding: 5px 7px;
      font-size: 0.82rem;
      box-sizing: border-box;
    }
    input[type="text"]:focus {
      outline: none;
      border-color: var(--primary-color, #03a9f4);
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
    }

    .chip {
      background: var(--secondary-background-color, #2a2a2a);
      border: 1px solid var(--divider-color, #444);
      border-radius: 12px;
      padding: 1px 7px;
      font-size: 0.7rem;
      cursor: pointer;
      color: var(--secondary-text-color, #aaa);
      white-space: nowrap;
    }
    .chip:hover {
      border-color: var(--primary-color, #03a9f4);
      color: var(--primary-color, #03a9f4);
    }

    input[type="color"] {
      width: 34px;
      height: 32px;
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      background: none;
      cursor: pointer;
      padding: 1px;
    }

    .behavior-wrap {
      min-width: 130px;
    }

    .btn {
      background: none;
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      color: var(--secondary-text-color, #aaa);
      cursor: pointer;
      padding: 4px 7px;
      font-size: 0.8rem;
      line-height: 1;
    }
    .btn:hover { color: var(--primary-text-color, #e0e0e0); }
    .btn:disabled { opacity: 0.3; cursor: default; }
    .btn.delete:hover { color: var(--error-color, #cf6679); border-color: var(--error-color, #cf6679); }
  `;render(){const e=this.rule||{};return F`
      <div class="row">
        <span class="label">${this.label||"SI"}</span>

        <div class="condition-wrap">
          <input
            type="text"
            .value=${e.condition||""}
            placeholder="state == on"
            @input=${e=>this._change("condition",e.target.value)}
          />
          ${this.chips?.length?F`
              <div class="chips">
                ${this.chips.map(e=>F`
                    <span class="chip" @click=${()=>this._setCondition(e.value)}>
                      ${e.label}
                    </span>
                  `)}
              </div>`:""}
        </div>

        <input
          type="color"
          .value=${e.color||"#ffffff"}
          title="Couleur"
          @input=${e=>this._change("color",e.target.value)}
        />

        <div class="behavior-wrap">
          <behavior-picker
            .value=${e.behavior||"solid"}
            .hass=${this.hass}
            @value-changed=${e=>this._change("behavior",e.detail.value)}
          ></behavior-picker>
        </div>

        <div style="display:flex;gap:3px;">
          <button class="btn" title="Monter"
            ?disabled=${this.isFirst}
            @click=${()=>this.dispatchEvent(new CustomEvent("rule-move-up",{bubbles:!0,composed:!0}))}>
            ↑
          </button>
          <button class="btn" title="Descendre"
            ?disabled=${this.isLast}
            @click=${()=>this.dispatchEvent(new CustomEvent("rule-move-down",{bubbles:!0,composed:!0}))}>
            ↓
          </button>
          <button class="btn delete" title="Supprimer"
            ?disabled=${this.isOnly}
            @click=${()=>this.dispatchEvent(new CustomEvent("rule-delete",{bubbles:!0,composed:!0}))}>
            ✕
          </button>
        </div>
      </div>
    `}_change(e,t){this.dispatchEvent(new CustomEvent("rule-changed",{detail:{rule:{...this.rule,[e]:t}},bubbles:!0,composed:!0}))}_setCondition(e){this.dispatchEvent(new CustomEvent("rule-changed",{detail:{rule:{...this.rule,condition:e}},bubbles:!0,composed:!0}))}}customElements.define("rule-row",Ee);class Ae extends ne{static properties={rules:{type:Array},entityState:{type:Object},hass:{attribute:!1}};static styles=r`
    :host { display: block; }

    .section-title {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--secondary-text-color, #888);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 12px 0 8px;
    }

    .footer {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .btn-add {
      background: none;
      border: 1px dashed var(--primary-color, #03a9f4);
      border-radius: 4px;
      color: var(--primary-color, #03a9f4);
      padding: 5px 12px;
      cursor: pointer;
      font-size: 0.82rem;
    }
    .btn-add:hover { background: var(--secondary-background-color, #1e1e1e); }

    select.template-select {
      background: var(--secondary-background-color, #1e1e1e);
      color: var(--secondary-text-color, #aaa);
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      padding: 5px 8px;
      font-size: 0.82rem;
      cursor: pointer;
    }
  `;_getLabel(e,t,i){return i(1===t||0===e?"rules.if":e===t-1?"rules.else":"rules.elif")}_buildChips(){const e=[],t=this.entityState;if(e.push({label:"défaut",value:"default"}),e.push({label:"indisponible",value:"unavailable"}),!t)return e;const i=parseFloat(t.state);isNaN(i)?("unavailable"!==t.state&&e.push({label:`== ${t.state}`,value:`state == ${t.state}`}),e.push({label:"== on",value:"state == on"}),e.push({label:"== off",value:"state == off"})):(e.push({label:`>= ${Math.round(.75*i)}`,value:`state >= ${Math.round(.75*i)}`}),e.push({label:`<= ${Math.round(.25*i)}`,value:`state <= ${Math.round(.25*i)}`}));for(const[i,s]of Object.entries(t.attributes||{})){const t=parseFloat(s);!isNaN(t)&&isFinite(t)&&e.push({label:`attr.${i} >= ${Math.round(.5*t)}`,value:`attribute.${i} >= ${Math.round(.5*t)}`})}return e}render(){const e=pe(this.hass),t=this.rules||[],i=this._buildChips();return F`
      <div class="section-title">${e("rules.title")}</div>

      ${t.map((s,o)=>F`
        <rule-row
          .rule=${s}
          .hass=${this.hass}
          .label=${this._getLabel(o,t.length,e)}
          .chips=${0===o?i:[]}
          ?isFirst=${0===o}
          ?isLast=${o===t.length-1}
          ?isOnly=${1===t.length}
          @rule-changed=${e=>this._onRuleChanged(o,e.detail.rule)}
          @rule-delete=${()=>this._onDelete(o)}
          @rule-move-up=${()=>this._onMove(o,-1)}
          @rule-move-down=${()=>this._onMove(o,1)}
        ></rule-row>
      `)}

      <div class="footer">
        <button class="btn-add" @click=${this._addRule}>${e("rules.add")}</button>
        <select class="template-select" @change=${this._applyTemplate}>
          <option value="">${e("rules.template")}</option>
          ${fe.map(t=>F`<option value=${t.id}>${e(`tpl.${t.id}`)||t.name}</option>`)}
        </select>
      </div>
    `}_emit(e){this.dispatchEvent(new CustomEvent("rules-changed",{detail:{rules:e},bubbles:!0,composed:!0}))}_onRuleChanged(e,t){const i=[...this.rules||[]];i[e]=t,this._emit(i)}_onDelete(e){const t=(this.rules||[]).filter((t,i)=>i!==e);this._emit(t)}_onMove(e,t){const i=[...this.rules||[]],s=e+t;s<0||s>=i.length||([i[e],i[s]]=[i[s],i[e]],this._emit(i))}_addRule(){const e=[...this.rules||[]];e.push({condition:"default",color:"#ffffff",behavior:"solid"}),this._emit(e)}_applyTemplate(e){const t=e.target.value;if(!t)return;e.target.value="";const i=fe.find(e=>e.id===t);i&&this._emit([...i.rules.map(e=>({...e}))])}}customElements.define("rules-editor",Ae);const ke=["low","medium","high"];class Me extends ne{static properties={open:{type:Boolean,reflect:!0},hass:{attribute:!1},cell:{type:Object},assignment:{type:Object},_edit:{state:!0},_saving:{state:!0},_entitySearch:{state:!0},_showSuggest:{state:!0}};static styles=r`
    :host { display: contents; }

    /* Overlay */
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    /* Dialog panel */
    .dialog {
      background: var(--card-background-color, #1c1c1c);
      border: 1px solid var(--divider-color, #333);
      border-radius: 8px;
      width: 100%;
      max-width: 640px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    }

    /* Header */
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px 10px;
      border-bottom: 1px solid var(--divider-color, #333);
      flex-shrink: 0;
    }
    .dialog-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--primary-text-color, #e0e0e0);
    }
    .btn-close {
      background: none;
      border: none;
      color: var(--secondary-text-color, #888);
      cursor: pointer;
      font-size: 1.1rem;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .btn-close:hover { color: var(--primary-text-color, #e0e0e0); background: var(--secondary-background-color, #2a2a2a); }

    /* Body — scrollable */
    .dialog-body {
      padding: 14px 18px;
      overflow-y: auto;
      flex: 1;
    }

    /* Form fields */
    .field {
      margin-bottom: 14px;
    }
    .field-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--secondary-text-color, #888);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 5px;
    }

    /* Entity input */
    .entity-input-wrap {
      position: relative;
    }
    .entity-input {
      width: 100%;
      background: var(--secondary-background-color, #1e1e1e);
      color: var(--primary-text-color, #e0e0e0);
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      padding: 7px 10px;
      font-size: 0.9rem;
      box-sizing: border-box;
    }
    .entity-input:focus {
      outline: none;
      border-color: var(--primary-color, #03a9f4);
    }
    .entity-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--card-background-color, #1c1c1c);
      border: 1px solid var(--primary-color, #03a9f4);
      border-top: none;
      border-radius: 0 0 4px 4px;
      max-height: 180px;
      overflow-y: auto;
      z-index: 10;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    .entity-suggestion {
      padding: 7px 10px;
      font-size: 0.82rem;
      cursor: pointer;
      color: var(--primary-text-color, #e0e0e0);
    }
    .entity-suggestion:hover, .entity-suggestion.focused {
      background: var(--secondary-background-color, #2a2a2a);
    }
    .entity-suggestion .friendly {
      font-size: 0.75rem;
      color: var(--secondary-text-color, #888);
      margin-top: 1px;
    }

    /* Importance toggle */
    .importance-row {
      display: flex;
      gap: 6px;
    }
    .imp-btn {
      flex: 1;
      padding: 6px 4px;
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      background: none;
      color: var(--secondary-text-color, #aaa);
      cursor: pointer;
      font-size: 0.8rem;
      text-align: center;
    }
    .imp-btn:hover { border-color: var(--primary-color, #03a9f4); color: var(--primary-color, #03a9f4); }
    .imp-btn.active {
      border-color: var(--primary-color, #03a9f4);
      background: var(--primary-color, #03a9f4);
      color: #fff;
    }

    /* LEDs info badge */
    .leds-info {
      font-size: 0.8rem;
      color: var(--secondary-text-color, #888);
      background: var(--secondary-background-color, #2a2a2a);
      border-radius: 4px;
      padding: 6px 10px;
    }

    /* Footer */
    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 18px 14px;
      border-top: 1px solid var(--divider-color, #333);
      flex-shrink: 0;
      gap: 8px;
    }
    .footer-left { display: flex; gap: 8px; }
    .footer-right { display: flex; gap: 8px; }

    button.btn-primary {
      background: var(--primary-color, #03a9f4);
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 8px 18px;
      cursor: pointer;
      font-size: 0.88rem;
      font-weight: 600;
    }
    button.btn-primary:disabled { opacity: 0.5; cursor: default; }
    button.btn-secondary {
      background: none;
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      color: var(--primary-text-color, #e0e0e0);
      padding: 8px 14px;
      cursor: pointer;
      font-size: 0.88rem;
    }
    button.btn-danger {
      background: none;
      border: 1px solid var(--error-color, #cf6679);
      border-radius: 4px;
      color: var(--error-color, #cf6679);
      padding: 8px 14px;
      cursor: pointer;
      font-size: 0.88rem;
    }
    button.btn-danger:hover { background: var(--error-color, #cf6679); color: #fff; }
  `;willUpdate(e){e.has("open")&&this.open&&(this.assignment?this._edit=JSON.parse(JSON.stringify(this.assignment)):this._edit={id:`assignment_${Date.now()}`,label:"",entity_id:"",importance:"medium",brightness_base:30,leds:[{panel:this.cell?.panel??0,row:this.cell?.row??0,col:this.cell?.col??0}],rules:[{condition:"default",color:"#00ff00",behavior:"solid"}]},this._saving=!1,this._entitySearch=this._edit.entity_id||"",this._showSuggest=!1)}_entitySuggestions(){const e=(this._entitySearch||"").toLowerCase().trim();return e&&this.hass?.states?Object.entries(this.hass.states).filter(([t,i])=>{const s=(i.attributes?.friendly_name||"").toLowerCase();return t.toLowerCase().includes(e)||s.includes(e)}).slice(0,20).map(([e,t])=>({id:e,friendly:t.attributes?.friendly_name||""})):[]}render(){if(!this.open)return F``;const e=this._edit||{},t=!this.assignment,i=this.hass?.states?.[e.entity_id];this.cell;const s=pe(this.hass),o=s(t?"dlg.new":"dlg.edit");return F`
      <div class="overlay" @click=${this._onOverlayClick}>
        <div class="dialog" @click=${e=>e.stopPropagation()}>

          <div class="dialog-header">
            <span class="dialog-title">${o}</span>
            <button class="btn-close" @click=${this._cancel}>✕</button>
          </div>

          <div class="dialog-body">

            <!-- Entity -->
            <div class="field">
              <div class="field-label">${s("dlg.entity")}</div>
              <div class="entity-input-wrap">
                <input
                  class="entity-input"
                  type="text"
                  placeholder="${s("dlg.entity.ph")}"
                  .value=${this._entitySearch||""}
                  @input=${this._onEntityInput}
                  @focus=${()=>{this._showSuggest=!0}}
                  @blur=${()=>{setTimeout(()=>{this._showSuggest=!1},200)}}
                />
                ${this._showSuggest&&this._entitySuggestions().length?F`
                    <div class="entity-suggestions">
                      ${this._entitySuggestions().map(e=>F`
                        <div class="entity-suggestion"
                          @mousedown=${()=>this._selectEntity(e.id)}>
                          <div>${e.id}</div>
                          ${e.friendly?F`<div class="friendly">${e.friendly}</div>`:""}
                        </div>
                      `)}
                    </div>`:""}
              </div>
            </div>

            <!-- Importance -->
            <div class="field">
              <div class="field-label">${s("dlg.importance")}</div>
              <div class="importance-row">
                ${ke.map(t=>F`
                  <button
                    class="imp-btn ${e.importance===t?"active":""}"
                    @click=${()=>this._setField("importance",t)}
                  >${s(`dlg.imp.${t}`)}</button>
                `)}
              </div>
            </div>

            <!-- LEDs info -->
            <div class="field">
              <div class="field-label">${s("dlg.leds")}</div>
              <div class="leds-info">
                ${(e.leds||[]).length} LED(s) :
                ${(e.leds||[]).map(e=>`P${e.panel+1}·R${e.row+1}·C${e.col+1}`).join(", ")}
              </div>
            </div>

            <!-- Rules -->
            <rules-editor
              .rules=${e.rules||[]}
              .hass=${this.hass}
              .entityState=${i?{state:i.state,attributes:i.attributes}:null}
              @rules-changed=${this._onRulesChanged}
            ></rules-editor>

          </div>

          <div class="dialog-footer">
            <div class="footer-left">
              ${t?"":F`<button class="btn-danger" @click=${this._delete}>${s("dlg.delete")}</button>`}
            </div>
            <div class="footer-right">
              <button class="btn-secondary" @click=${this._cancel}>${s("dlg.cancel")}</button>
              <button class="btn-primary" ?disabled=${this._saving||!e.entity_id} @click=${this._save}>
                ${this._saving?s("dlg.saving"):s("dlg.save")}
              </button>
            </div>
          </div>

        </div>
      </div>
    `}_setField(e,t){this._edit={...this._edit,[e]:t}}_onEntityInput(e){this._entitySearch=e.target.value,this._showSuggest=!0,this.hass?.states?.[e.target.value]&&(this._edit={...this._edit,entity_id:e.target.value})}_selectEntity(e){this._entitySearch=e,this._edit={...this._edit,entity_id:e},this._showSuggest=!1}_onRulesChanged(e){this._edit={...this._edit,rules:e.detail.rules}}_onOverlayClick(){this._cancel()}_cancel(){this.dispatchEvent(new CustomEvent("dialog-cancel",{bubbles:!0,composed:!0}))}_save(){this._saving=!0,this.dispatchEvent(new CustomEvent("dialog-save",{detail:{assignment:{...this._edit}},bubbles:!0,composed:!0}))}_delete(){this.dispatchEvent(new CustomEvent("dialog-delete",{bubbles:!0,composed:!0}))}}customElements.define("led-dialog",Me);class Oe extends ne{static properties={hass:{attribute:!1},_config:{state:!0}};static styles=r`
    .form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 0;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.85rem;
      color: var(--secondary-text-color, #888);
    }
    input {
      background: var(--card-background-color, #1e1e1e);
      color: var(--primary-text-color, #e0e0e0);
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      padding: 6px 8px;
      font-size: 0.9rem;
    }
    .hint {
      font-size: 0.75rem;
      color: var(--secondary-text-color, #888);
    }
  `;setConfig(e){this._config=e}render(){if(!this._config)return F``;const e=pe(this.hass);return F`
      <div class="form">
        <label>
          ${e("editor.panel_code")}
          <input
            type="text"
            .value=${this._config.panel_code||""}
            placeholder="${e("editor.panel_code.ph")}"
            @input=${e=>this._update("panel_code",e.target.value)}
          />
          <span class="hint">${e("editor.panel_code.h")}</span>
        </label>

        <label>
          ${e("editor.config_path")}
          <input
            type="text"
            .value=${this._config.config_path||""}
            placeholder="led_panel_config.json"
            @input=${e=>this._update("config_path",e.target.value)}
          />
          <span class="hint">${e("editor.config_path.h")}</span>
        </label>

        <label>
          ${e("editor.title")}
          <input
            type="text"
            .value=${this._config.title||""}
            placeholder="${e("editor.title.ph")}"
            @input=${e=>this._update("title",e.target.value)}
          />
        </label>
      </div>
    `}_update(e,t){this._config={...this._config,[e]:t},this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._config},bubbles:!0,composed:!0}))}}customElements.define("led-panel-card-editor",Oe);class Pe extends ne{static properties={_config:{state:!0},_panelConfig:{state:!0},_loading:{state:!0},_error:{state:!0},_liveColors:{state:!0},_liveMode:{state:!0},_selection:{state:!0},_dialogOpen:{state:!0},_dialogCells:{state:!0},_dialogAssign:{state:!0},_saveStatus:{state:!0},_saveMsg:{state:!0}};constructor(){super(),this._selection=new Set,this._liveMode=!0}static styles=r`
    :host { display: block; }
    ha-card { padding: 12px; position: relative; }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .card-title {
      font-size: 1rem;
      font-weight: 500;
      color: var(--primary-text-color, #e0e0e0);
    }
    .header-actions { display: flex; gap: 6px; align-items: center; }

    .reload-btn {
      background: none;
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      color: var(--primary-text-color, #e0e0e0);
      padding: 4px 10px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .reload-btn:hover { background: var(--secondary-background-color, #2a2a2a); }

    .live-btn {
      background: none;
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      color: var(--secondary-text-color, #888);
      padding: 4px 10px;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .live-btn.active {
      border-color: #4caf50;
      color: #4caf50;
    }
    .live-btn:hover { background: var(--secondary-background-color, #2a2a2a); }

    .panels-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
    }
    .panel-wrapper { flex: 0 0 auto; }

    /* Selection toolbar */
    .selection-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      padding: 7px 10px;
      background: var(--secondary-background-color, #1e1e1e);
      border: 1px solid var(--primary-color, #03a9f4);
      border-radius: 6px;
      flex-wrap: wrap;
    }
    .selection-bar .count {
      font-size: 0.85rem;
      color: var(--primary-color, #03a9f4);
      font-weight: 600;
      flex: 1;
    }
    .btn-configure {
      background: var(--primary-color, #03a9f4);
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 6px 14px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .btn-configure:hover { filter: brightness(1.15); }
    .btn-clear {
      background: none;
      border: 1px solid var(--divider-color, #444);
      border-radius: 4px;
      color: var(--secondary-text-color, #aaa);
      padding: 6px 10px;
      cursor: pointer;
      font-size: 0.82rem;
    }
    .btn-clear:hover { color: var(--primary-text-color, #e0e0e0); }

    .loading, .error, .empty {
      padding: 24px;
      text-align: center;
      color: var(--secondary-text-color, #888);
      font-size: 0.9rem;
    }
    .error { color: var(--error-color, #cf6679); }

    .hint {
      text-align: center;
      font-size: 0.75rem;
      color: var(--secondary-text-color, #555);
      margin-top: 8px;
    }

    /* Save toast */
    .toast {
      position: absolute;
      bottom: 12px;
      right: 12px;
      padding: 6px 14px;
      border-radius: 4px;
      font-size: 0.82rem;
      font-weight: 600;
      pointer-events: none;
      animation: fadeout 3s forwards;
    }
    .toast.saved  { background: #1b5e20; color: #a5d6a7; }
    .toast.error  { background: #4e1217; color: #ef9a9a; }
    .toast.saving { background: var(--secondary-background-color, #2a2a2a); color: var(--secondary-text-color, #aaa); animation: none; }

    @keyframes fadeout {
      0%   { opacity: 1; }
      70%  { opacity: 1; }
      100% { opacity: 0; }
    }
  `;setConfig(e){if(!e.panel_code&&!e.config_path)throw new Error("panel_code ou config_path est requis");const t=this._config;this._config=e,!this._hass||t?.panel_code===e.panel_code&&t?.config_path===e.config_path||this._loadConfig()}set hass(e){const t=!this._hass;this._hass=e,t&&this._config&&this._loadConfig(),this._panelConfig&&this._updateLiveColors()}static getConfigElement(){return document.createElement("led-panel-card-editor")}static getStubConfig(){return{type:"custom:led-panel-card",panel_code:"light.led_status_panel",title:"Panneau LED"}}async _loadConfig(){this._loading=!0,this._error=null;try{let e=this._config.config_path,t=null;if(!e&&this._config.panel_code){const i=await async function(e,t){const i=`/api/led_status_panel/panel?panel_code=${encodeURIComponent(t)}`;return ce(await fetch(i,{headers:de(e)}))}(this._hass,this._config.panel_code);if(!i.ok){const e=pe(this._hass);return void(this._error=`${e("card.error.panel")} : ${i.error||"panel_not_found"}`)}e=i.config_path,t=i.entry_id||null}const i=await async function(e,t){const i=`/api/led_status_panel/config?path=${encodeURIComponent(t)}`;return ce(await fetch(i,{headers:de(e)}))}(this._hass,e);if(!i.ok){const e=pe(this._hass);return void(this._error=`${e("card.error.config")} : ${i.error}`)}this._panelConfig=i.data,this._configPath=e,t&&(this._entryId=t),this._updateLiveColors()}catch(e){const t=pe(this._hass);this._error=`${t("card.error.network")} : ${e.message}`}finally{this._loading=!1}}_updateLiveColors(){if(!this._panelConfig||!this._hass)return;const e=new Map;for(const t of this._panelConfig.assignments||[]){const i=xe(t,this._hass.states);if(!i)continue;const s=_e(i,t.importance),o=i.behavior||"solid";for(const i of t.leds||[])e.set(`${i.panel}-${i.row}-${i.col}`,{color:s,behavior:o})}this._liveColors=e}_buildTooltipMap(){const e=new Map;if(!this._panelConfig)return e;for(const t of this._panelConfig.assignments||[]){const i=t.entity_id||"",s=this._hass?.states?.[i],o=s?.attributes?.friendly_name||i,r=s?s.state:"—",n=o!==i?`${o}\n${i}\nÉtat : ${r}`:`${i}\nÉtat : ${r}`;for(const i of t.leds||[])e.set(`${i.panel}-${i.row}-${i.col}`,n)}return e}_onCellClick(e){const{panel:t,row:i,col:s}=e.detail,o=`${t}-${i}-${s}`,r=new Set(this._selection);r.has(o)?r.delete(o):r.add(o),this._selection=r}_clearSelection(){this._selection=new Set}_openDialogFromSelection(){const e=[...this._selection].map(e=>{const[t,i,s]=e.split("-").map(Number);return{panel:t,row:i,col:s}});if(!e.length)return;const t=ue(this._panelConfig?.assignments||[]),i=e.map(e=>t.get(`${e.panel}-${e.row}-${e.col}`)),s=[...new Set(i.filter(Boolean).map(e=>e.id))],o=1===s.length?i.find(Boolean):null;this._dialogCells=e,this._dialogAssign=o||null,this._dialogOpen=!0}_onDialogSave(e){const t={...e.detail.assignment,leds:this._dialogCells};this._dialogOpen=!1,this._clearSelection(),this._applyAssignment(t)}_onDialogDelete(){this._dialogOpen=!1,this._clearSelection(),this._dialogAssign&&this._deleteAssignment(this._dialogAssign.id)}_onDialogCancel(){this._dialogOpen=!1}_applyAssignment(e){const t=[...this._panelConfig?.assignments||[]],i=t.findIndex(t=>t.id===e.id);i>=0?t[i]=e:t.push(e),this._panelConfig={...this._panelConfig,assignments:t},this._updateLiveColors(),this._persistConfig()}_deleteAssignment(e){const t=(this._panelConfig?.assignments||[]).filter(t=>t.id!==e);this._panelConfig={...this._panelConfig,assignments:t},this._updateLiveColors(),this._persistConfig()}async _persistConfig(){const e=pe(this._hass);this._saveStatus="saving",this._saveMsg=e("save.saving");try{const t=await async function(e,t,i){const s=`/api/led_status_panel/config?path=${encodeURIComponent(t)}`;return ce(await fetch(s,{method:"POST",headers:de(e),body:JSON.stringify({data:i})}))}(this._hass,this._configPath,this._panelConfig);if(!t.ok)return this._saveStatus="error",this._saveMsg=`${e("save.error")} : ${t.error}`,void setTimeout(()=>{this._saveStatus="idle"},4e3);this._saveMsg=e("save.reloading");try{await async function(e,{entryId:t,configPath:i}={}){return ce(await fetch("/api/led_status_panel/reload",{method:"POST",headers:de(e),body:JSON.stringify({entry_id:t||"",config_path:i||""})}))}(this._hass,{entryId:this._entryId,configPath:this._configPath}),this._saveStatus="saved",this._saveMsg=e("save.saved")}catch(t){this._saveStatus="saved",this._saveMsg=e("save.saved.noreload")}}catch(t){this._saveStatus="error",this._saveMsg=`${e("save.error")} : ${t.message}`}setTimeout(()=>{this._saveStatus="idle"},4e3)}render(){const e=pe(this._hass),t=this._selection?.size||0;return F`
      <ha-card>
        <div class="card-header">
          <span class="card-title">${this._config?.title||e("card.title")}</span>
          <div class="header-actions">
            <button
              class="live-btn ${this._liveMode?"active":""}"
              title="${this._liveMode?e("card.live.on"):e("card.live.off")}"
              @click=${()=>{this._liveMode=!this._liveMode}}
            >${e("card.live")}</button>
            <button class="reload-btn" title="${e("card.reload")}" @click=${this._loadConfig}>↺</button>
          </div>
        </div>

        ${t>0?F`
          <div class="selection-bar">
            <span class="count">${t} ${e(t>1?"sel.leds.plural":"sel.leds")}</span>
            <button class="btn-clear" @click=${this._clearSelection}>${e("sel.clear")}</button>
            <button class="btn-configure" @click=${this._openDialogFromSelection}>${e("sel.configure")}</button>
          </div>
        `:""}

        ${this._loading?F`<div class="loading">${e("card.loading")}</div>`:this._error?F`<div class="error">${this._error}</div>`:this._renderPanels()}

        ${this._saveStatus&&"idle"!==this._saveStatus?F`<div class="toast ${this._saveStatus}">${this._saveMsg}</div>`:""}

        <led-dialog
          .open=${this._dialogOpen||!1}
          .hass=${this._hass}
          .cell=${this._dialogCells?.[0]}
          .assignment=${this._dialogAssign}
          @dialog-save=${this._onDialogSave}
          @dialog-delete=${this._onDialogDelete}
          @dialog-cancel=${this._onDialogCancel}
        ></led-dialog>
      </ha-card>
    `}_renderPanels(){const e=pe(this._hass);if(!this._panelConfig)return F`<div class="empty">${e("card.empty")}</div>`;const t=this._panelConfig.panels||1,i=ue(this._panelConfig.assignments||[]),s=this._buildTooltipMap();return F`
      <div class="panels-row">
        ${Array.from({length:t},(t,o)=>F`
          <div class="panel-wrapper">
            <led-grid
              .panel=${o}
              .ledMap=${i}
              .liveColors=${this._liveMode&&this._liveColors||new Map}
              .getColor=${be}
              .selection=${this._selection}
              .tooltipMap=${s}
              label="${e("card.panel.label")} ${o+1}"
              @cell-click=${this._onCellClick}
            ></led-grid>
          </div>
        `)}
      </div>
      ${0===this._selection?.size?F`<div class="hint">${e("card.hint")}</div>`:""}
    `}}customElements.define("led-panel-card",Pe),window.customCards=window.customCards||[],window.customCards.push({type:"led-panel-card",name:"LED Panel Card",description:"Carte de visualisation et configuration des panneaux LED WS2812 (8×8)",preview:!0,documentationURL:"https://github.com/djiesr/led-status-panel"});
