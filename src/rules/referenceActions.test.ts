import { Schema } from "extract-pg-schema";
import { describe, expect, it, test, vi } from "vitest";

import DeepPartial from "../tests/DeepPartial";
import { referenceActions } from "./referenceActions";

describe("referenceActions", () => {
  describe("no tables", () => {
    it("should pass when no tables exist", () => {
      const mockReporter = vi.fn();
      const schemaObject: DeepPartial<Schema> = {
        tables: [],
        views: [],
      };

      referenceActions.process({
        options: [{}],
        schemaObject: schemaObject as Schema,
        report: mockReporter,
      });

      expect(mockReporter).toBeCalledTimes(0);
    });
  });

  describe("single column reference", () => {
    test.each([
      { option: {} }, // [onUpdate, onDelete] = [skipped, skipped]
      { option: { onUpdate: "NO ACTION" } }, // [correct, skipped]
      { option: { onDelete: "CASCADE" } }, // [skipped, correct]
      { option: { onUpdate: "NO ACTION", onDelete: "CASCADE" } }, // [correct, correct]
    ])(
      "should pass when specified value is undefined or same as actual: $option",
      ({ option }) => {
        const mockReporter = vi.fn();
        const schemaObject: DeepPartial<Schema> = {
          name: "schema",
          tables: [
            {
              name: "test",
              columns: [
                {
                  name: "id",
                  references: [
                    {
                      name: "test_id_fkey",
                      onUpdate: "NO ACTION",
                      onDelete: "CASCADE",
                    },
                  ],
                },
              ],
            },
          ],
        };

        referenceActions.process({
          options: [option],
          schemaObject: schemaObject as Schema,
          report: mockReporter,
        });

        expect(mockReporter).toBeCalledTimes(0);
      },
    );

    test.each([
      {
        option: { onUpdate: "CASCADE" }, // [onUpdate, onDelete] = [wrong, skipped]
        expectedMessages: [
          `Reference action ON UPDATE expected to be "CASCADE" but got "NO ACTION"`,
        ],
      },
      {
        option: { onUpdate: "CASCADE", onDelete: "CASCADE" }, // [wrong, correct]
        expectedMessages: [
          `Reference action ON UPDATE expected to be "CASCADE" but got "NO ACTION"`,
        ],
      },
      {
        option: { onDelete: "NO ACTION" }, // [skipped, wrong]
        expectedMessages: [
          `Reference action ON DELETE expected to be "NO ACTION" but got "CASCADE"`,
        ],
      },
      {
        option: { onUpdate: "NO ACTION", onDelete: "NO ACTION" }, // [correct, wrong]
        expectedMessages: [
          `Reference action ON DELETE expected to be "NO ACTION" but got "CASCADE"`,
        ],
      },
      {
        option: { onUpdate: "CASCADE", onDelete: "NO ACTION" }, // [wrong, wrong]
        expectedMessages: [
          `Reference action ON UPDATE expected to be "CASCADE" but got "NO ACTION"`,
          `Reference action ON DELETE expected to be "NO ACTION" but got "CASCADE"`,
        ],
      },
    ])(
      "should report when specified value is not undefined and differs: $option",
      ({ option, expectedMessages }) => {
        const mockReporter = vi.fn();
        const schemaObject: DeepPartial<Schema> = {
          name: "schema",
          tables: [
            {
              name: "test",
              columns: [
                {
                  name: "id",
                  references: [
                    {
                      name: "test_id_fkey",
                      onUpdate: "NO ACTION",
                      onDelete: "CASCADE",
                    },
                  ],
                },
              ],
            },
          ],
        };

        referenceActions.process({
          options: [option],
          schemaObject: schemaObject as Schema,
          report: mockReporter,
        });

        expect(mockReporter).toBeCalledTimes(expectedMessages.length);
        expectedMessages.forEach((expectedMessage) => {
          expect(mockReporter).toBeCalledWith(
            expect.objectContaining({
              rule: "reference-actions",
              identifier: `schema.test.test_id_fkey`,
              message: expectedMessage,
            }),
          );
        });
      },
    );
  });

  describe("multiple column reference", () => {
    it("should report only once when multiple column reference has incorrect action", () => {
      const mockReporter = vi.fn();
      const schemaObject: DeepPartial<Schema> = {
        name: "schema",
        tables: [
          {
            name: "test",
            columns: [
              {
                name: "id",
                references: [
                  {
                    name: "test_id_sub_id_fkey",
                    onUpdate: "NO ACTION",
                    onDelete: "CASCADE",
                  },
                ],
              },
              {
                name: "sub_id",
                references: [
                  {
                    name: "test_id_sub_id_fkey",
                    onUpdate: "NO ACTION",
                    onDelete: "CASCADE",
                  },
                ],
              },
            ],
          },
        ],
      };

      referenceActions.process({
        options: [{ onUpdate: "CASCADE" }],
        schemaObject: schemaObject as Schema,
        report: mockReporter,
      });

      expect(mockReporter).toBeCalledTimes(1);
      expect(mockReporter).toBeCalledWith(
        expect.objectContaining({
          rule: "reference-actions",
          identifier: `schema.test.test_id_sub_id_fkey`,
          message: `Reference action ON UPDATE expected to be "CASCADE" but got "NO ACTION"`,
        }),
      );
    });
  });
});
