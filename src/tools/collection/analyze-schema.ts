import { BaseTool, ToolResponse } from "../base/tool.js";
import { buildCollectionSchema } from "../../mongodb/schema.js";
import { db } from "../../mongodb/client.js";

type AnalyzeSchemaParams = {
    collection: string;
    sampleSize?: number;
};

export class AnalyzeSchemaTool extends BaseTool<AnalyzeSchemaParams> {
    name = "analyze-schema";
    description = "Analyzes the schema of a collection by sampling documents and inferring their structure.";
    inputSchema = {
        type: "object" as const,
        properties: {
            collection: {
                type: "string",
                description: "Name of the collection to analyze",
            },
            sampleSize: {
                type: "number",
                description: "Number of documents to sample (default 10)",
            },
        },
        required: ["collection"],
    };

    async execute(params: AnalyzeSchemaParams): Promise<ToolResponse> {
        try {
            const collectionName = this.validateCollection(params.collection);
            const sampleSize = params.sampleSize || 10;
            
            const coll = db.collection(collectionName);
            
            const schema = await buildCollectionSchema(coll, sampleSize);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(schema, null, 2),
                    },
                ],
                isError: false,
            };
        } catch (error) {
            return this.handleError(error);
        }
    }
}

