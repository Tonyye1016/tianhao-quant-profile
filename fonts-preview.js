"use strict";
const sizeControl = document.getElementById("sample-size");
sizeControl.addEventListener("change", () => {
  const size = Number(sizeControl.value);
  if ([16, 17, 18, 20].includes(size)) {
    document.documentElement.style.setProperty("--sample-size", (size / 16) + "rem");
  }
});
for (const candidate of document.querySelectorAll(".candidate")) {
  const family = candidate.dataset.family;
  const boldWeight = family === "Lato" ? 700 : 600;
  Promise.all([
    document.fonts.load('400 16px "' + family + '"'),
    document.fonts.load(boldWeight + ' 16px "' + family + '"')
  ]).then((faces) => {
    if (faces.some((list) => list.length === 0)) throw new Error("Font unavailable");
    candidate.dataset.loadState = "loaded";
    candidate.querySelector(".font-state").textContent = "";
  }).catch(() => {
    candidate.dataset.loadState = "failed";
    candidate.querySelector(".font-state").textContent = "字体未加载，请刷新后比较";
  });
}
