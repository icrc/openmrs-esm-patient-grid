import React, { useState } from 'react';
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
  Button,
  DataTableSkeleton,
} from '@carbon/react';
import { ChevronSort, ArrowUp, ArrowDown } from '@carbon/react/icons';
import {
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { FormGet, FormSchema, PatientGridColumnDef, PatientGridGet, PatientGridReportGet } from '../api';
import { useHistoricEncountersGrid } from './useHistoricEncountersGrid';
import styles from './HistoricEncountersGrid.scss';
import { useVisibleColumnsOnly } from '../grid-utils';

export interface HistoricEncountersGridProps {
  patientId: string;
  form: FormGet;
  formSchema: FormSchema;
  report: PatientGridReportGet;
  patientGrid: PatientGridGet;
}

const stableEmptyArray = [];

export function HistoricEncountersGrid({
  patientId,
  form,
  formSchema,
  report,
  patientGrid,
}: HistoricEncountersGridProps) {
  const { t } = useTranslation();
  const { data } = useHistoricEncountersGrid(patientId, form, formSchema, report);
  const [sorting, setSorting] = useState<SortingState>([]);
  const visibleColumns = useVisibleColumnsOnly(data?.columns ?? stableEmptyArray);
  const table = useReactTable({
    columns: visibleColumns,
    data: data?.data ?? stableEmptyArray,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
    },
  });
  const headerGroups = table.getHeaderGroups();
  for (let i = 0; i < headerGroups.length; i++) {
    for (let j = 0; j < headerGroups[i].headers.length; j++) {
      for (let k = 0; k < headerGroups[i].headers[j].column.columns.length; k++) {
        for (let l = 0; l < patientGrid.columns.length; l++) {
          if (headerGroups[i].headers[j].column.columns[k].id === patientGrid.columns[l].name) {
            const columnDef = headerGroups[i].headers[j].column.columns[k].columnDef;
            headerGroups[i].headers[j].column.columns[k].columnDef.header =
              ((columnDef as PatientGridColumnDef).headerPrefix ?? '') + patientGrid.columns[l].display;
            break;
          }
        }
      }
    }
  }
  if (!data) {
    <DataTableSkeleton showHeader={false} showToolbar={false} />;
  }

  return (
    <Table className={styles.table} useZebraStyles>
      <TableHead>
        {headerGroups.map((headerGroup, headerGroupIndex) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHeader key={header.id} colSpan={header.colSpan}>
                {header.isPlaceholder ? null : (
                  <div className={styles.headerWithActions}>
                    {flexRender(header.column.columnDef.header, header.getContext())}

                    {headerGroupIndex === headerGroups.length - 1 && (
                      <>
                        <Button
                          hasIconOnly
                          renderIcon={
                            header.column.getIsSorted() !== false
                              ? header.column.getIsSorted() === 'desc'
                                ? ArrowDown
                                : ArrowUp
                              : ChevronSort
                          }
                          size="sm"
                          kind="ghost"
                          iconDescription={t('patientGridSortColumnDescription', 'Sort')}
                          onClick={header.column.getToggleSortingHandler()}
                        />
                        {/* <PatientGridColumnFiltersButton
                          columnDisplayName={header.column.columnDef.header?.toString() ?? ''}
                          column={header.column}
                        /> */}
                      </>
                    )}
                  </div>
                )}
              </TableHeader>
            ))}
          </TableRow>
        ))}
      </TableHead>

      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
