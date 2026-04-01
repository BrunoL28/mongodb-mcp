import { BaseTool, ToolResponse } from "../base/tool.js";
import { db } from "../../mongodb/client.js";

type DropCollectionParams = {
    collection: string;
};

export class DropCollectionTool extends BaseTool<DropCollectionParams> {
    name = "drop-collection";
    description = "Drops (deletes) a collection from the database.";
    inputSchema = {
        type: "object" as const,
        properties: {
            collection: {
                type: "string",
                description: "Name of the collection to drop",
            }
        },
        required: ["collection"],
    };

    async execute(params: DropCollectionParams): Promise<ToolResponse> {
        try {
            const collectionName = this.validateCollection(params.collection);
            const result = await db.dropCollection(collectionName);
            
            return {
                content: [
                    {
                        type: "text",
                        text: `Collection '${collectionName}' dropped successfully. Result: ${result}`,
                    },
                ],
                isError: false,
            };
        } catch (error) {
            return this.handleError(error);
        }
    }
}
