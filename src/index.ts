import { defineConfigSchema, getAsyncLifecycle, openmrsFetch, registerBreadcrumbs } from '@openmrs/esm-framework';
import { PatientGridGet } from './api';
import { configSchema } from './config-schema';

declare let __VERSION__: string;
const version = __VERSION__;
/**
 * This tells the app shell how to obtain translation files: that they
 * are JSON files in the directory `../translations` (which you should
 * see in the directory structure).
 */
const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

const backendDependencies = {
  fhir2: '^1.2.0',
  'webservices.rest': '^2.2.0',
};

function setupOpenMRS() {
  const basePath = `${window.spaBase}/patient-grids`;
  const moduleName = '@icrc/esm-patient-grid-app';
  const options = {
    featureName: 'patientgrid-app',
    moduleName,
  };

  defineConfigSchema(moduleName, configSchema);

  registerBreadcrumbs([
    {
      path: basePath,
      title: 'Patient Grids',
      parent: `${window.spaBase}/home`,
    },
    {
      path: `${basePath}/:id`,
      title: ([id]: [string]) =>
        openmrsFetch<PatientGridGet>(`/ws/rest/v1/patientgrid/patientgrid/${id}?v=full`)
          .then(({ data }) => data?.name ?? 'Patient Grid')
          .catch(() => 'Patient Grid'),
      parent: basePath,
    },
  ]);

  return {
    pages: [
      {
        load: getAsyncLifecycle(() => import('./Root'), options),
        route: 'patient-grids',
        online: true,
        offline: true,
      },
    ],
    extensions: [
      {
        id: 'patient-grids-link',
        slot: 'app-menu-slot',
        load: getAsyncLifecycle(() => import('./AppMenuLink'), options),
        online: true,
        offline: true,
      },
    ],
  };
}

export { backendDependencies, importTranslation, setupOpenMRS, version };
