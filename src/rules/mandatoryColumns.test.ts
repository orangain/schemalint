import { Schema } from "extract-pg-schema";
import { describe, expect, it, vi } from "vitest";

import DeepPartial from "../tests/DeepPartial";
import { mandatoryColumns } from "./mandatoryColumns";

describe("mandatoryColumns", () => {
  describe("no tables", () => {
    it("should pass when no tables exist", () => {
      const mockReporter = vi.fn();
      const schemaObject: DeepPartial<Schema> = {
        tables: [],
        views: [],
      };

      mandatoryColumns.process({
        options: [{}],
        schemaObject: schemaObject as Schema,
        report: mockReporter,
      });

      expect(mockReporter).toBeCalledTimes(0);
    });
  });

  describe("single mandatory column", () => {
    it("should pass when mandatory column exists", () => {
      const mockReporter = vi.fn();
      const schemaObject: DeepPartial<Schema> = {
        name: "schema",
        tables: [
          {
            name: "test",
            columns: [{ name: "id", expandedType: "pg_catalog.int4" }],
          },
        ],
      };

      mandatoryColumns.process({
        options: [[{ name: "id", expandedType: "pg_catalog.int4" }]],
        schemaObject: schemaObject as Schema,
        report: mockReporter,
      });

      expect(mockReporter).toBeCalledTimes(0);
    });

    it("should report when mandatory column does not exist", () => {
      const mockReporter = vi.fn();
      const schemaObject: DeepPartial<Schema> = {
        name: "schema",
        tables: [
          {
            name: "test",
            columns: [],
          },
        ],
      };

      mandatoryColumns.process({
        options: [[{ name: "id", expandedType: "pg_catalog.int4" }]],
        schemaObject: schemaObject as Schema,
        report: mockReporter,
      });

      expect(mockReporter).toBeCalledTimes(1);
      expect(mockReporter).toBeCalledWith(
        expect.objectContaining({
          rule: "mandatory-columns",
          identifier: `schema.test`,
          message: `Column "id" of type "pg_catalog.int4" is missing`,
        }),
      );
    });

    it("should report when mandatory column exists but type differs", () => {
      const mockReporter = vi.fn();
      const schemaObject: DeepPartial<Schema> = {
        name: "schema",
        tables: [
          {
            name: "test",
            columns: [{ name: "id", expandedType: "pg_catalog.int2" }],
          },
        ],
      };

      mandatoryColumns.process({
        options: [[{ name: "id", expandedType: "pg_catalog.int4" }]],
        schemaObject: schemaObject as Schema,
        report: mockReporter,
      });

      expect(mockReporter).toBeCalledTimes(1);
      expect(mockReporter).toBeCalledWith(
        expect.objectContaining({
          rule: "mandatory-columns",
          identifier: `schema.test.id`,
          message: `Column "id" is of type "pg_catalog.int2" but expected "pg_catalog.int4"`,
        }),
      );
    });
  });

  describe("multiple mandatory columns", () => {
    it("should pass when multiple mandatory columns exist", () => {
      const mockReporter = vi.fn();
      const schemaObject: DeepPartial<Schema> = {
        name: "schema",
        tables: [
          {
            name: "test",
            columns: [
              { name: "id", expandedType: "pg_catalog.int4" },
              { name: "created_at", expandedType: "pg_catalog.timestamptz" },
            ],
          },
        ],
      };

      mandatoryColumns.process({
        options: [
          [
            { name: "id", expandedType: "pg_catalog.int4" },
            { name: "created_at", expandedType: "pg_catalog.timestamptz" },
          ],
        ],
        schemaObject: schemaObject as Schema,
        report: mockReporter,
      });

      expect(mockReporter).toBeCalledTimes(0);
    });

    it("should report when one of the multiple mandatory columns does not exist", () => {
      const mockReporter = vi.fn();
      const schemaObject: DeepPartial<Schema> = {
        name: "schema",
        tables: [
          {
            name: "test",
            columns: [{ name: "id", expandedType: "pg_catalog.int4" }],
          },
        ],
      };

      mandatoryColumns.process({
        options: [
          [
            { name: "id", expandedType: "pg_catalog.int4" },
            { name: "created_at", expandedType: "pg_catalog.timestamptz" },
          ],
        ],
        schemaObject: schemaObject as Schema,
        report: mockReporter,
      });

      expect(mockReporter).toBeCalledTimes(1);
      expect(mockReporter).toBeCalledWith(
        expect.objectContaining({
          rule: "mandatory-columns",
          identifier: `schema.test`,
          message: `Column "created_at" of type "pg_catalog.timestamptz" is missing`,
        }),
      );
    });

    it("should report when multiple mandatory columns do not exist", () => {
      const mockReporter = vi.fn();
      const schemaObject: DeepPartial<Schema> = {
        name: "schema",
        tables: [
          {
            name: "test",
            columns: [],
          },
        ],
      };

      mandatoryColumns.process({
        options: [
          [
            { name: "id", expandedType: "pg_catalog.int4" },
            { name: "created_at", expandedType: "pg_catalog.timestamptz" },
          ],
        ],
        schemaObject: schemaObject as Schema,
        report: mockReporter,
      });

      expect(mockReporter).toBeCalledTimes(2);
      expect(mockReporter).toBeCalledWith(
        expect.objectContaining({
          rule: "mandatory-columns",
          identifier: `schema.test`,
          message: `Column "id" of type "pg_catalog.int4" is missing`,
        }),
      );
      expect(mockReporter).toBeCalledWith(
        expect.objectContaining({
          rule: "mandatory-columns",
          identifier: `schema.test`,
          message: `Column "created_at" of type "pg_catalog.timestamptz" is missing`,
        }),
      );
    });
  });
});
