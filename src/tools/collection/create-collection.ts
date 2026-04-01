import { BaseTool, ToolResponse } from "../base/tool.js";
import { db } from "../../mongodb/client.js";

type CreateCollectionParams = {
    collection: string;
};

export class CreateCollectionTool extends BaseTool<CreateCollectionParams> {
    name = "create-collection";
    description = "Creates a new collection in the database.";
    inputSchema = {
        type: "object" as const,
        properties: {
            collection: {
                type: "string",
                description: "Name of the collection to create",
            }
        },
        required: ["collection"],
    };

    async execute(params: CreateCollectionParams): Promise<ToolResponse> {
        try {
            const collectionName = this.validateCollection(params.collection);
            // Create collection with default options for simplicity
            await db.createCollection(collectionName);
            
            return {
                content: [
                    {
                        type: "text",
                        text: `Collection '${collectionName}' created successfully.`,
                    },
                ],
                isError: false,
            };
        } catch (error) {
            return this.handleError(error);
        }
    }
}
