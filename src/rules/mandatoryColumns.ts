import { TableColumn, TableDetails } from "extract-pg-schema";
import * as R from "ramda";

import Rule from "../Rule";

type ExpectedColumn = {
  name: string;
} & Partial<TableColumn>;

export const mandatoryColumns: Rule = {
  name: "mandatory-columns",
  docs: {
    description: "Require tables to have specific columns",
  },
  process({ options: [option], schemaObject, report }) {
    const expectedColumns = option ?? [];
    const validator = ({ name: tableName, columns }: TableDetails) => {
      const columnsByName = R.indexBy(R.prop("name"), columns);
      expectedColumns.forEach(({ name, ...expectedProps }: ExpectedColumn) => {
        const column = columnsByName[name];
        if (!column) {
          report({
            rule: this.name,
            identifier: `${schemaObject.name}.${tableName}`,
            message: `Mandatory column "${name}" is missing`,
          });
        } else {
          const { name: _, ...partialColumnProps } = R.pick(
            Object.keys(expectedProps) as (keyof TableColumn)[],
            column,
          );
          if (!R.equals(partialColumnProps, expectedProps)) {
            report({
              rule: this.name,
              identifier: `${schemaObject.name}.${tableName}.${column.name}`,
              message: `Column "${column.name}" has properties ${JSON.stringify(partialColumnProps)} but expected ${JSON.stringify(expectedProps)}`,
            });
          }
        }
      });
    };
    schemaObject.tables.forEach(validator);
  },
};
