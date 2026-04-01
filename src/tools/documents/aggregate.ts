import { BaseTool, ToolResponse } from "../base/tool.js";
import { db } from "../../mongodb/client.js";

type AggregateParams = {
    collection: string;
    pipeline: Record<string, unknown>[];
    options?: {
        allowDiskUse?: boolean;
        maxTimeMS?: number;
    };
};

export class AggregateTool extends BaseTool<AggregateParams> {
    name = "aggregate";
    description = "Executes an aggregation pipeline on a collection. Useful for complex queries, data transformations, and analytics.";
    inputSchema = {
        type: "object" as const,
        properties: {
            collection: {
                type: "string",
                description: "Name of the collection to aggregate",
            },
            pipeline: {
                type: "array",
                description: "Array of aggregation pipeline stages (e.g., [{$match: {...}}, {$group: {...}}])",
                items: {
                    type: "object"
                }
            },
            options: {
                type: "object",
                description: "Aggregation options",
                properties: {
                    allowDiskUse: { type: "boolean" },
                    maxTimeMS: { type: "number" },
                },
                additionalProperties: false,
            },
        },
        required: ["collection", "pipeline"],
    };

    async execute(params: AggregateParams): Promise<ToolResponse> {
        try {
            const collectionName = this.validateCollection(params.collection);
            if (!Array.isArray(params.pipeline)) {
                throw new Error("pipeline must be an array of objects");
            }
            
            const coll = db.collection(collectionName);
            const cursor = coll.aggregate(params.pipeline, params.options);
            const result = await cursor.toArray();

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
