import Ajv from "ajv";
import { presentationSchema } from "../appwrite/schemas/presentationSchema";
import { makeSlide, uid, type Presentation } from "../types";

const ajv = new Ajv({ allErrors: true, strict: false });
const validatePresentation = ajv.compile(presentationSchema);

type ParseResult =
  | { ok: true; presentation: Presentation }
  | { ok: false; error: string };

export function parsePresentationJson(payload: string, lang: "ru" | "en"): ParseResult {
  let parsed: Presentation;
  try {
    parsed = JSON.parse(payload) as Presentation;
  } catch {
    return {
      ok: false,
      error: lang === "ru" ? "Файл не является корректным JSON." : "File is not valid JSON.",
    };
  }
  if (!validatePresentation(parsed)) {
    return {
      ok: false,
      error:
        lang === "ru"
          ? "Файл не соответствует формату презентации."
          : "File is not a valid presentation.",
    };
  }
  return { ok: true, presentation: parsed };
}

export function prepareImportedPresentation(
  presentation: Presentation,
  fallbackTitle: string | null,
) {
  const slides = presentation.slides.length ? presentation.slides : [makeSlide("Slide")];
  const title = presentation.title?.trim() || fallbackTitle || "Presentation";
  return {
    ...presentation,
    id: uid(),
    title,
    slides,
    selection: { slideId: slides[0].id, elementIds: [] },
  };
}
