import { BaseTool, ToolResponse } from "../base/tool.js";
import { db } from "../../mongodb/client.js";
import { AnyBulkWriteOperation } from "mongodb";

type BulkWriteParams = {
    collection: string;
    operations: Record<string, unknown>[];
};

export class BulkWriteTool extends BaseTool<BulkWriteParams> {
    name = "bulk-write";
    description = "Executes multiple write operations (insert, update, delete) in a single batch on a collection.";
    inputSchema = {
        type: "object" as const,
        properties: {
            collection: {
                type: "string",
                description: "Name of the collection",
            },
            operations: {
                type: "array",
                description: "Array of bulk write operations (e.g., [{ insertOne: { document: { a: 1 } } }, { updateOne: { filter: {a:2}, update: {$set: {a:2}} } }])",
                items: {
                    type: "object"
                }
            }
        },
        required: ["collection", "operations"],
    };

    async execute(params: BulkWriteParams): Promise<ToolResponse> {
        try {
            const collectionName = this.validateCollection(params.collection);
            
            if (!Array.isArray(params.operations)) {
                throw new Error("operations must be an array of bulk write operations");
            }
            
            const coll = db.collection(collectionName);
            
            // Cast to AnyBulkWriteOperation array. It's up to the LLM to format it correctly for mongodb driver
            const result = await coll.bulkWrite(params.operations as AnyBulkWriteOperation[]);
            
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2),
                    },
                ],
                isError: false,
            };
        } catch (error) {
            return this.handleError(error);
        }
    }
}
