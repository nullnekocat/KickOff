import {
  __name
} from "./chunk-TJFVSI2U.js";

// node_modules/country-flag-emoji-polyfill/dist/index.mjs
var r = '"Twemoji Mozilla","Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji","EmojiOne Color","Android Emoji",sans-serif';
function a() {
  const o = document.createElement("canvas");
  o.width = o.height = 1;
  const t = o.getContext("2d", { willReadFrequently: true });
  return t.textBaseline = "top", t.font = `100px ${r}`, t.scale(0.01, 0.01), t;
}
__name(a, "a");
function i(o, t, e) {
  return o.clearRect(0, 0, 100, 100), o.fillStyle = e, o.fillText(t, 0, 0), o.getImageData(0, 0, 1, 1).data.join(",");
}
__name(i, "i");
function l(o) {
  const t = a(), e = i(t, o, "#fff"), n = i(t, o, "#000");
  return n === e && !n.startsWith("0,0,0,");
}
__name(l, "l");
function f(o = "Twemoji Country Flags", t = "https://cdn.jsdelivr.net/npm/country-flag-emoji-polyfill@0.1/dist/TwemojiCountryFlags.woff2") {
  if (typeof window < "u" && l("😊") && !l("🇨🇭")) {
    const e = document.createElement("style");
    return e.textContent = `@font-face {
      font-family: "${o}";
      unicode-range: U+1F1E6-1F1FF, U+1F3F4, U+E0062-E0063, U+E0065, U+E0067,
        U+E006C, U+E006E, U+E0073-E0074, U+E0077, U+E007F;
      src: url('${t}') format('woff2');
      font-display: swap;
    }`, document.head.appendChild(e), true;
  }
  return false;
}
__name(f, "f");
export {
  f as polyfillCountryFlagEmojis
};
//# sourceMappingURL=country-flag-emoji-polyfill.js.map
