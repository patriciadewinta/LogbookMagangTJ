const path = "C:/Users/patri/.claude/image-cache/031c1a14-5f58-4244-b77b-0ab653a6154c/1.png";

(async () => {
  const Tesseract = require("tesseract.js");
  const { data } = await Tesseract.recognize(path, "eng", {});
  console.log("=== FULL TEXT ===");
  console.log(data.text);
  console.log("\n=== WORDS (with bbox) ===");
  for (const w of data.words) {
    const b = w.bbox;
    console.log(
      w.text.padEnd(20),
      "x:" + b.x0 + "-" + b.x1,
      "y:" + b.y0 + "-" + b.y1,
      "conf:" + Math.round(w.confidence)
    );
  }
})();
