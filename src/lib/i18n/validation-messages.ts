import type { Translator } from "@/lib/i18n/translator";

export function getAuthValidationMessages(t: Translator) {
  return {
    email: t("auth.validation.email"),
    passwordMin: t("auth.validation.passwordMin"),
    nameMin: t("auth.validation.nameMin"),
    confirmPassword: t("auth.validation.confirmPassword"),
    passwordsMismatch: t("auth.validation.passwordsMismatch"),
  };
}

export function getPersonValidationMessages(t: Translator) {
  return {
    firstNameRequired: t("person.validation.firstNameRequired"),
    lastNameRequired: t("person.validation.lastNameRequired"),
    validDate: t("person.validation.validDate"),
    validYear: t("person.validation.validYear"),
    biographyTooLong: t("person.validation.biographyTooLong"),
    occupationTooLong: t("person.validation.occupationTooLong"),
    otherNameTooLong: t("person.validation.otherNameTooLong"),
    deathAfterBirth: t("person.validation.deathAfterBirth"),
  };
}

export function getFamilyValidationMessages(t: Translator) {
  return {
    nameMin: t("family.validation.nameMin"),
    descriptionTooLong: t("family.validation.descriptionTooLong"),
    email: t("auth.validation.email"),
  };
}

export function getRelationshipValidationMessages(t: Translator) {
  return {
    selectPerson: t("relationship.validation.selectPerson"),
    validDate: t("person.validation.validDate"),
    endAfterStart: t("relationship.validation.endAfterStart"),
  };
}

export function getEventValidationMessages(t: Translator) {
  return {
    titleRequired: t("event.validation.titleRequired"),
    titleTooLong: t("event.validation.titleTooLong"),
    descriptionTooLong: t("event.validation.descriptionTooLong"),
    locationTooLong: t("event.validation.locationTooLong"),
    validDate: t("event.validation.validDate"),
    validYear: t("event.validation.validYear"),
  };
}

export function getDocumentValidationMessages(t: Translator) {
  return {
    titleRequired: t("document.validation.titleRequired"),
    titleTooLong: t("document.validation.titleTooLong"),
    descriptionTooLong: t("document.validation.descriptionTooLong"),
    unsupportedType: t("document.validation.unsupportedType"),
    fileRequired: t("document.validation.fileRequired"),
    fileTooLarge: t("document.validation.fileTooLarge"),
  };
}
