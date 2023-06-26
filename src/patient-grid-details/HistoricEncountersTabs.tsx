import React from 'react';
import { DataTableSkeleton, Tabs, TabList, Tab, TabPanels, TabPanel, TabsSkeleton } from '@carbon/react';
import styles from './HistoricEncountersTabs.scss';
import {
  PatientGridGet,
  PatientGridReportGet,
  PatientGridReportRowGet,
  useFormSchemasOfForms,
  useGetAllPrivilegeFilteredForms,
  useMergedSwr,
} from '../api';
import { getFormsReferencedInGridReport, getFormSchemaReferenceUuid } from '../grid-utils';
import { useTranslation } from 'react-i18next';
import { HistoricEncountersGrid } from './HistoricEncountersGrid';
import { EditSidePanelValues } from './PatientGridDetailsPage';

export interface HistoricEncountersTabsProps {
  report: PatientGridReportGet;
  reportRow: PatientGridReportRowGet;
  patientGrid: PatientGridGet;
  showEditSidePanel(values: EditSidePanelValues): void;
}

export function HistoricEncountersTabs({
  report,
  reportRow,
  patientGrid,
  showEditSidePanel,
}: HistoricEncountersTabsProps) {
  const { t } = useTranslation();
  const formsSwr = useGetAllPrivilegeFilteredForms();
  const formSchemasSwr = useFormSchemasOfForms(formsSwr.data);
  const { data: formsReferencedInGridReport } = useMergedSwr(
    () => {
      const { data: forms } = formsSwr;
      const { data: formSchemas } = formSchemasSwr;
      return getFormsReferencedInGridReport(report, forms, formSchemas);
    },
    [formsSwr, formSchemasSwr],
    [report],
  );

  return (
    <section className={styles.container}>
      {formsReferencedInGridReport ? (
        <Tabs>
          <TabList aria-label={t('historicEncountersTabsAriaLabel', 'Historic forms')} activation="manual" contained>
            {formsReferencedInGridReport.map((form) => (
              <Tab key={form.uuid}>{form.display}</Tab>
            ))}
          </TabList>
          <TabPanels>
            {formsReferencedInGridReport.map((form) => (
              <TabPanel key={form.uuid} className={styles.tabPanel}>
                <HistoricEncountersGrid
                  form={form}
                  formSchema={formSchemasSwr.data[getFormSchemaReferenceUuid(form)]}
                  patientId={reportRow.uuid}
                  report={report}
                  patientGrid={patientGrid}
                  showEditSidePanel={showEditSidePanel}
                />
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      ) : (
        <>
          <TabsSkeleton />
          <DataTableSkeleton showHeader={false} showToolbar={false} />
        </>
      )}
    </section>
  );
}
