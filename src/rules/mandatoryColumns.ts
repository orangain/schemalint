import { TableDetails } from "extract-pg-schema";
import * as R from "ramda";

import Rule from "../Rule";

type ExpectedColumn = {
  name: string;
  expandedType: string;
};

export const mandatoryColumns: Rule = {
  name: "mandatory-columns",
  docs: {
    description: "Require tables to have specific columns",
  },
  process({ options: [option], schemaObject, report }) {
    const expectedColumns = option ?? [];
    const validator = ({ name: tableName, columns }: TableDetails) => {
      const columnsByName = R.indexBy(R.prop("name"), columns);
      expectedColumns.forEach((expectedColumn: ExpectedColumn) => {
        const column = columnsByName[expectedColumn.name];
        if (!column) {
          report({
            rule: this.name,
            identifier: `${schemaObject.name}.${tableName}`,
            message: `Column "${expectedColumn.name}" of type "${expectedColumn.expandedType}" is missing`,
          });
        } else if (column.expandedType !== expectedColumn.expandedType) {
          report({
            rule: this.name,
            identifier: `${schemaObject.name}.${tableName}.${column.name}`,
            message: `Column "${column.name}" is of type "${column.expandedType}" but expected "${expectedColumn.expandedType}"`,
          });
        }
      });
    };
    schemaObject.tables.forEach(validator);
  },
};
