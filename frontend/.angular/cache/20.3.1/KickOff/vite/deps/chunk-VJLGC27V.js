import {
  MediaMatcher
} from "./chunk-F3RJAKGT.js";
import {
  ANIMATION_MODULE_TYPE,
  InjectionToken,
  NgModule,
  inject,
  setClassMetadata,
  ɵɵdefineInjector,
  ɵɵdefineNgModule
} from "./chunk-C4OSENFP.js";
import {
  __name,
  __publicField
} from "./chunk-TJFVSI2U.js";

// node_modules/@angular/cdk/fesm2022/layout.mjs
var _LayoutModule = class _LayoutModule {
};
__name(_LayoutModule, "LayoutModule");
__publicField(_LayoutModule, "ɵfac", /* @__PURE__ */ __name(function LayoutModule_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || _LayoutModule)();
}, "LayoutModule_Factory"));
__publicField(_LayoutModule, "ɵmod", ɵɵdefineNgModule({
  type: _LayoutModule
}));
__publicField(_LayoutModule, "ɵinj", ɵɵdefineInjector({}));
var LayoutModule = _LayoutModule;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(LayoutModule, [{
    type: NgModule,
    args: [{}]
  }], null, null);
})();

// node_modules/@angular/material/fesm2022/animation.mjs
var MATERIAL_ANIMATIONS = new InjectionToken("MATERIAL_ANIMATIONS");
var reducedMotion = null;
function _getAnimationsState() {
  if (inject(MATERIAL_ANIMATIONS, { optional: true })?.animationsDisabled || inject(ANIMATION_MODULE_TYPE, { optional: true }) === "NoopAnimations") {
    return "di-disabled";
  }
  reducedMotion ??= inject(MediaMatcher).matchMedia("(prefers-reduced-motion)").matches;
  return reducedMotion ? "reduced-motion" : "enabled";
}
__name(_getAnimationsState, "_getAnimationsState");
function _animationsDisabled() {
  return _getAnimationsState() !== "enabled";
}
__name(_animationsDisabled, "_animationsDisabled");

export {
  _animationsDisabled
};
//# sourceMappingURL=chunk-VJLGC27V.js.map
