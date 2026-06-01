import { Language } from '../types';
import { en, Translations } from './en';
import { de } from './de';
import { fr } from './fr';
import { es } from './es';
import { it } from './it';

const locales: Record<Language, Translations> = { EN: en, DE: de, FR: fr, ES: es, IT: it };

export function getTranslations(lang: Language): Translations {
  return locales[lang] ?? en;
}

export type { Translations };
