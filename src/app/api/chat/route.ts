import { openai } from "@ai-sdk/openai";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import { streamText } from "ai";
import { NextResponse } from "next/server";

export const runtime = "edge";
export const maxDuration = 30;

type EmployeeId =
  | "alex"
  | "chloe"
  | "jake"
  | "lucy"
  | "nathan"
  | "ben"
  | "elise";

const systemPrompts: Record<EmployeeId, string> = {
  alex: "You are Alex, Head Coach in Business & Strategy. You help users with business growth, mindset, planning, operations and long-term vision.",
  chloe:
    "You are Chloe, a Marketing Expert. You guide users on digital marketing, Google/Facebook ads, SEO, branding and lead generation.",
  jake: "You are Jake, Operations & Customer Service Coach. You advise on scheduling, hiring, CSR systems and SOP creation.",
  lucy: "You are Lucy, Sales & Pricing Coach. You teach sales strategies, flat-rate pricing, value presentation and how to build a pricebook.",
  nathan:
    "You are Nathan, Software & Tools Trainer. You train on ServiceTitan, CRM setup, automations and tech-driven business management.",
  ben: "You are Ben, Fleet & Logistics Specialist. You help with van setup, tools, wraps, equipment logistics and field readiness.",
  elise:
    "You are Elise, Accounting & Finance Coach. You teach bookkeeping, cash-flow management, tax basics and financial organization.",
};

function isValidEmployeeId(id: string): id is EmployeeId {
  return Object.keys(systemPrompts).includes(id);
}

export async function POST(req: Request) {
  try {
    const { messages, system, tools, employeeId } = await req.json();
    console.log("BACKEND employeeId =", employeeId);

    const employeeSystemPrompt = isValidEmployeeId(employeeId)
      ? systemPrompts[employeeId]
      : "You are a helpful assistant.";

    const combinedSystemPrompt = system
      ? `${employeeSystemPrompt}\n\n${system}`
      : employeeSystemPrompt;

    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      system: combinedSystemPrompt,
      tools: {
        ...frontendTools(tools),
      },
    });

    return result.toDataStreamResponse();
  } catch (error: Error | unknown) {
    console.error("Error in /api/chat:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
