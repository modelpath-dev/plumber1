import { AssistantCloud } from "@assistant-ui/react";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

export const POST = async () => {
  const { userId, orgId } = await auth(); // Corrected: auth() is asynchronous and needs await

  if (!userId) {
    console.error("User not authenticated in API route. userId is null.");
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }

  const assistantApiKey = process.env["ASSISTANT_API_KEY"];
  if (!assistantApiKey) {
    console.error("ASSISTANT_API_KEY is not set.");
    return NextResponse.json({ error: "Assistant API key not configured" }, { status: 500 });
  }

  const workspaceId = orgId ? `${orgId}:${userId}` : userId;
  
  try {
    // Corrected AssistantCloud instantiation based on assistant-ui docs and linter feedback
    const assistantCloud = new AssistantCloud({
      apiKey: assistantApiKey,
      userId: userId, 
      workspaceId: workspaceId,
    });

    // Corrected: create() should take no arguments if userId and workspaceId are in constructor
    const tokenData = await assistantCloud.auth.tokens.create(); 

    return new Response(tokenData.token, { status: 200 });
  } catch (error) {
    console.error("Error creating assistant token:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error creating token";
    return NextResponse.json({ error: "Failed to create assistant token", details: errorMessage }, { status: 500 });
  }
}; 