// Système de traductions centralisé pour l'internationalisation
// Extensible pour supporter d'autres langues

type TranslationMessages = {
  suppliers: {
    created: string;
    updated: string;
    deleted: string;
    imported: (count: number) => string;
    error: (msg: string) => string;
    importError: (msg: string) => string;
  };
  validation: {
    nameRequired: string;
    invalidEmail: string;
    maxLength: (max: number) => string;
  };
  csv: {
    minLines: string;
    missingName: (line: number) => string;
    invalidEmail: (line: number, email: string) => string;
    nameColumnRequired: string;
    readyToImport: (count: number) => string;
    andMoreErrors: (count: number) => string;
  };
  common: {
    error: string;
    success: string;
    cancel: string;
    import: string;
    download: string;
  };
};

type Translations = {
  fr: TranslationMessages;
  en: TranslationMessages;
};

export const translations: Translations = {
  fr: {
    suppliers: {
      created: 'Fournisseur créé avec succès',
      updated: 'Fournisseur mis à jour avec succès',
      deleted: 'Fournisseur supprimé',
      imported: (count: number) => `${count} fournisseur(s) importé(s) avec succès`,
      error: (msg: string) => `Erreur: ${msg}`,
      importError: (msg: string) => `Erreur d'import: ${msg}`,
    },
    validation: {
      nameRequired: 'Le nom est requis',
      invalidEmail: 'Email invalide',
      maxLength: (max: number) => `Maximum ${max} caractères`,
    },
    csv: {
      minLines: 'Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données',
      missingName: (line: number) => `Ligne ${line}: Nom manquant`,
      invalidEmail: (line: number, email: string) => `Ligne ${line}: Email invalide "${email}"`,
      nameColumnRequired: 'Colonne "name" ou "nom" requise',
      readyToImport: (count: number) => `${count} fournisseur(s) prêt(s) à importer`,
      andMoreErrors: (count: number) => `...et ${count} autres erreurs`,
    },
    common: {
      error: 'Erreur',
      success: 'Succès',
      cancel: 'Annuler',
      import: 'Importer',
      download: 'Télécharger',
    },
  },
  en: {
    suppliers: {
      created: 'Supplier created successfully',
      updated: 'Supplier updated successfully',
      deleted: 'Supplier deleted',
      imported: (count: number) => `${count} supplier(s) imported successfully`,
      error: (msg: string) => `Error: ${msg}`,
      importError: (msg: string) => `Import error: ${msg}`,
    },
    validation: {
      nameRequired: 'Name is required',
      invalidEmail: 'Invalid email',
      maxLength: (max: number) => `Maximum ${max} characters`,
    },
    csv: {
      minLines: 'File must contain at least a header line and a data line',
      missingName: (line: number) => `Line ${line}: Name missing`,
      invalidEmail: (line: number, email: string) => `Line ${line}: Invalid email "${email}"`,
      nameColumnRequired: '"name" or "nom" column is required',
      readyToImport: (count: number) => `${count} supplier(s) ready to import`,
      andMoreErrors: (count: number) => `...and ${count} more errors`,
    },
    common: {
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      import: 'Import',
      download: 'Download',
    },
  },
};

// Langue par défaut - peut être étendu avec un contexte React plus tard
export type SupportedLanguage = keyof Translations;
export const currentLanguage: SupportedLanguage = 'fr';
export const t = translations[currentLanguage];
