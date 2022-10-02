import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SWRResponse } from 'swr';
import {
  useGetAllPublishedPrivilegeFilteredForms,
  useFormSchemas,
  useGetBulkConceptsByReferences,
  useMergedSwr,
} from '../api';
import {
  patientDetailsNameColumnName,
  patientDetailsCountryColumnName,
  patientDetailsStructureColumnName,
  patientDetailsGenderColumnName,
  patientDetailsAgeCategoryColumnName,
  getFormDateColumnName,
  getFormSchemaQuestionColumnName,
} from './columnNames';
import {
  getUnlabeledConceptIdentifiersFromSchema,
  getFormSchemaReferenceUuid,
  getFormSchemaQuestionsMappableToColumns,
} from './formSchema';

/**
 * Returns a map which allows to easy retrieval of the patient grid column labels that should be displayed to the user.
 * The map is keyed by the unique name of the column.
 * The map is supposed to contain labels for all columns which:
 * 1. Are hard-coded inside this module (e.g. all patient detail columns, see, for example, {@link patientDetailsNameColumnName}).
 * 2. Are created from a form schema question that has a concept label defined.
 *
 * It can happen that this map doesn't contain a label for a column name, e.g. when a concept label doesn't exist
 * in the backend. In such cases, a fallback must be manually provided by the user.
 * @returns A map which maps unique column names to the labels that should be displayed to the user.
 */
export function useColumnNameToHeaderLabelMap(): SWRResponse<Record<string, string>> {
  const { t } = useTranslation();
  const formsSwr = useGetAllPublishedPrivilegeFilteredForms();
  const formSchemasSwr = useFormSchemas(
    formsSwr.data?.map((form) => form.resources.find((resource) => resource.name === 'JSON schema').valueReference),
  );
  const formLabelConceptIds = useMemo(
    () =>
      Object.values(formSchemasSwr.data ?? {}).flatMap((formSchema) =>
        getUnlabeledConceptIdentifiersFromSchema(formSchema),
      ),
    [formSchemasSwr.data],
  );
  const formLabelConceptsSwr = useGetBulkConceptsByReferences(formLabelConceptIds);

  return useMergedSwr(
    () => {
      const { data: forms } = formsSwr;
      const { data: formSchemas } = formSchemasSwr;
      const { data: formLabelConcepts } = formLabelConceptsSwr;
      const result: Record<string, string> = {
        // Hardcoded names which always have the same key.
        [patientDetailsNameColumnName]: t('patientGridColumnHeaderPatientName', 'Patient name'),
        [patientDetailsCountryColumnName]: t('patientGridColumnHeaderCountry', 'Country'),
        [patientDetailsStructureColumnName]: t('patientGridColumnHeaderStructure', 'Structure'),
        [patientDetailsGenderColumnName]: t('patientGridColumnHeaderGender', 'Gender'),
        [patientDetailsAgeCategoryColumnName]: t('patientGridColumnHeaderAgeCategory', 'Age category'),
      };

      for (const form of forms) {
        const formSchema = formSchemas[getFormSchemaReferenceUuid(form)];
        if (!formSchema) {
          continue;
        }

        // Each form column group always has the "Date" column.
        result[getFormDateColumnName(form)] = t('patientGridColumnHeaderFormDate', 'Date');

        // Each question column might have a header coming from concept labels.
        const formQuestions = getFormSchemaQuestionsMappableToColumns(form, formSchema);
        for (const { question } of formQuestions) {
          const columnName = getFormSchemaQuestionColumnName(form, question);
          const conceptLabel = formLabelConcepts[question.questionOptions?.concept]?.display;

          if (conceptLabel) {
            result[columnName] = conceptLabel;
          }
        }
      }

      return result;
    },
    [formsSwr, formSchemasSwr, formLabelConceptsSwr],
    [t],
  );
}
