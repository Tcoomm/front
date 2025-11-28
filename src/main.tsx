// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import {
  getModel,
  setEditorModel,
  addEditorChangeHandler,
} from "./editor";
import { makeMaximalPresentation } from "./Testdata";

// 1. Создаём стартовую модель
const initial = makeMaximalPresentation();

// 2. Кладём её в editor-хранилище
setEditorModel(initial);

const root = createRoot(document.getElementById("root")!);

// 3. Функция рендера всегда берёт актуальную модель из editor.ts
function render() {
  root.render(<App model={getModel()} />);
}

// 4. Подписываемся на изменения + первый рендер
addEditorChangeHandler(render);
render();
