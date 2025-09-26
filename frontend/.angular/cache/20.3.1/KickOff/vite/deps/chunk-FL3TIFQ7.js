import {
  DOCUMENT,
  Directive,
  EventEmitter,
  Injectable,
  InjectionToken,
  Input,
  NgModule,
  Output,
  inject,
  setClassMetadata,
  signal,
  ɵɵProvidersFeature,
  ɵɵattribute,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule
} from "./chunk-C4OSENFP.js";
import {
  __name,
  __publicField
} from "./chunk-TJFVSI2U.js";

// node_modules/@angular/cdk/fesm2022/directionality.mjs
var DIR_DOCUMENT = new InjectionToken("cdk-dir-doc", {
  providedIn: "root",
  factory: DIR_DOCUMENT_FACTORY
});
function DIR_DOCUMENT_FACTORY() {
  return inject(DOCUMENT);
}
__name(DIR_DOCUMENT_FACTORY, "DIR_DOCUMENT_FACTORY");
var RTL_LOCALE_PATTERN = /^(ar|ckb|dv|he|iw|fa|nqo|ps|sd|ug|ur|yi|.*[-_](Adlm|Arab|Hebr|Nkoo|Rohg|Thaa))(?!.*[-_](Latn|Cyrl)($|-|_))($|-|_)/i;
function _resolveDirectionality(rawValue) {
  const value = rawValue?.toLowerCase() || "";
  if (value === "auto" && typeof navigator !== "undefined" && navigator?.language) {
    return RTL_LOCALE_PATTERN.test(navigator.language) ? "rtl" : "ltr";
  }
  return value === "rtl" ? "rtl" : "ltr";
}
__name(_resolveDirectionality, "_resolveDirectionality");
var _Directionality = class _Directionality {
  /** The current 'ltr' or 'rtl' value. */
  get value() {
    return this.valueSignal();
  }
  /**
   * The current 'ltr' or 'rtl' value.
   */
  valueSignal = signal("ltr", ...ngDevMode ? [{
    debugName: "valueSignal"
  }] : []);
  /** Stream that emits whenever the 'ltr' / 'rtl' state changes. */
  change = new EventEmitter();
  constructor() {
    const _document = inject(DIR_DOCUMENT, {
      optional: true
    });
    if (_document) {
      const bodyDir = _document.body ? _document.body.dir : null;
      const htmlDir = _document.documentElement ? _document.documentElement.dir : null;
      this.valueSignal.set(_resolveDirectionality(bodyDir || htmlDir || "ltr"));
    }
  }
  ngOnDestroy() {
    this.change.complete();
  }
};
__name(_Directionality, "Directionality");
__publicField(_Directionality, "ɵfac", /* @__PURE__ */ __name(function Directionality_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _Directionality)();
}, "Directionality_Factory"));
__publicField(_Directionality, "ɵprov", ɵɵdefineInjectable({
  token: _Directionality,
  factory: _Directionality.ɵfac,
  providedIn: "root"
}));
var Directionality = _Directionality;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Directionality, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();

// node_modules/@angular/cdk/fesm2022/bidi.mjs
var _Dir = class _Dir {
  /** Whether the `value` has been set to its initial value. */
  _isInitialized = false;
  /** Direction as passed in by the consumer. */
  _rawDir;
  /** Event emitted when the direction changes. */
  change = new EventEmitter();
  /** @docs-private */
  get dir() {
    return this.valueSignal();
  }
  set dir(value) {
    const previousValue = this.valueSignal();
    this.valueSignal.set(_resolveDirectionality(value));
    this._rawDir = value;
    if (previousValue !== this.valueSignal() && this._isInitialized) {
      this.change.emit(this.valueSignal());
    }
  }
  /** Current layout direction of the element. */
  get value() {
    return this.dir;
  }
  valueSignal = signal("ltr", ...ngDevMode ? [{
    debugName: "valueSignal"
  }] : []);
  /** Initialize once default value has been set. */
  ngAfterContentInit() {
    this._isInitialized = true;
  }
  ngOnDestroy() {
    this.change.complete();
  }
};
__name(_Dir, "Dir");
__publicField(_Dir, "ɵfac", /* @__PURE__ */ __name(function Dir_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _Dir)();
}, "Dir_Factory"));
__publicField(_Dir, "ɵdir", ɵɵdefineDirective({
  type: _Dir,
  selectors: [["", "dir", ""]],
  hostVars: 1,
  hostBindings: /* @__PURE__ */ __name(function Dir_HostBindings(rf, ctx) {
    if (rf & 2) {
      ɵɵattribute("dir", ctx._rawDir);
    }
  }, "Dir_HostBindings"),
  inputs: {
    dir: "dir"
  },
  outputs: {
    change: "dirChange"
  },
  exportAs: ["dir"],
  features: [ɵɵProvidersFeature([{
    provide: Directionality,
    useExisting: _Dir
  }])]
}));
var Dir = _Dir;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Dir, [{
    type: Directive,
    args: [{
      selector: "[dir]",
      providers: [{
        provide: Directionality,
        useExisting: Dir
      }],
      host: {
        "[attr.dir]": "_rawDir"
      },
      exportAs: "dir"
    }]
  }], null, {
    change: [{
      type: Output,
      args: ["dirChange"]
    }],
    dir: [{
      type: Input
    }]
  });
})();
var _BidiModule = class _BidiModule {
};
__name(_BidiModule, "BidiModule");
__publicField(_BidiModule, "ɵfac", /* @__PURE__ */ __name(function BidiModule_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _BidiModule)();
}, "BidiModule_Factory"));
__publicField(_BidiModule, "ɵmod", ɵɵdefineNgModule({
  type: _BidiModule,
  imports: [Dir],
  exports: [Dir]
}));
__publicField(_BidiModule, "ɵinj", ɵɵdefineInjector({}));
var BidiModule = _BidiModule;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BidiModule, [{
    type: NgModule,
    args: [{
      imports: [Dir],
      exports: [Dir]
    }]
  }], null, null);
})();

export {
  DIR_DOCUMENT,
  Directionality,
  Dir,
  BidiModule
};
//# sourceMappingURL=chunk-FL3TIFQ7.js.map
