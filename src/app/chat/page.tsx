/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AssistantCloud,
  AssistantRuntimeProvider,
  useThreadRuntime,
  ThreadMessage,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { Thread } from "@/components/assistant-ui/thread";
import { EmployeeSelector, employees } from "@/components/EmployeeSelector";
import { ChevronLeft } from "lucide-react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { CoreMessage } from "ai";

// Re-define EmployeeId type
type EmployeeId =
  | "sales"
  | "support"
  | "marketing"
  | "developer"
  | "hr"
  | "jerry"
  | "adrian";

// Default mapping of employees to Mastra agents
const employeeToAgentMap = {
  elise: "EliseAgent",
  nathan: "nathanAgent",
  lucy: "lucyAgent",
  jake: "jakeAgent",
  chloe: "chloeAgent",
  ben: "benAgent",
  alex: "alexAgent",
  default: "ragAgent",
};

// Initialize AssistantCloud
const cloud = new AssistantCloud({
  baseUrl: process.env["NEXT_PUBLIC_ASSISTANT_BASE_URL"]!,
  authToken: () =>
    fetch("/api/assistant-ui-token", { method: "POST" })
      .then((response) => response.text())
      .catch((e) => {
        console.error("Failed to fetch or process assistant token:", e);
        return "";
      }),
});

// New Client Component to handle useSearchParams
function ChatPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize selectedEmployee with a fallback
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeId>(
    (searchParams.get("employeeId") as EmployeeId) || "sales"
  );

  // Get the agentName from URL or use the default mapping
  const [agentName, setAgentName] = useState<string>(
    searchParams.get("agentName") ||
      employeeToAgentMap[selectedEmployee as keyof typeof employeeToAgentMap] ||
      employeeToAgentMap.default
  );

  // Handler for employee change
  const handleEmployeeChange = useCallback(
    (newEmployeeId: string) => {
      console.log("CHANGING EMPLOYEE TO:", newEmployeeId);
      setSelectedEmployee(newEmployeeId as EmployeeId);

      // Update agent name based on the employee
      const newAgentName =
        employeeToAgentMap[newEmployeeId as keyof typeof employeeToAgentMap] ||
        employeeToAgentMap.default;
      setAgentName(newAgentName);

      // Update URL
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set("employeeId", newEmployeeId);
      params.set("agentName", newAgentName);
      router.replace(`/chat?${params.toString()}`);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    [searchParams, router]
  );

  // Update selected employee if URL changes
  useEffect(() => {
    const employeeId = searchParams.get("employeeId");
    const urlAgentName = searchParams.get("agentName");

    if (
      employeeId &&
      employees.some((employee) => employee.id === employeeId) &&
      employeeId !== selectedEmployee
    ) {
      console.log("URL CHANGE - New assistant:", employeeId);
      setSelectedEmployee(employeeId as EmployeeId);

      // Update agent name if provided in URL, otherwise use mapping
      if (urlAgentName) {
        setAgentName(urlAgentName);
      } else {
        setAgentName(
          employeeToAgentMap[employeeId as keyof typeof employeeToAgentMap] ||
            employeeToAgentMap.default
        );
      }
    } else if (urlAgentName && urlAgentName !== agentName) {
      setAgentName(urlAgentName);
    }
  }, [searchParams, selectedEmployee, agentName]);

  // Create runtime
  console.log("RUNTIME for", selectedEmployee, "using agent:", agentName);
  const runtime = useChatRuntime({
    api: `http://localhost:4111/api/agents/${agentName}/stream`,
    body: { employeeId: selectedEmployee },
    cloud,
  });

  // Get current employee for display
  const currentEmployee =
    employees.find((e) => e.id === selectedEmployee) || employees[0];

  return (
    <AssistantRuntimeProvider
      runtime={runtime}
      key={`${selectedEmployee}-${agentName}`}
    >
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex flex-col w-64 border-r border-gray-200 bg-gray-50">
          <div className="p-3 border-b border-gray-200">
            <div className="text-xs font-medium text-gray-500">
              CURRENT ASSISTANT
            </div>
            <EmployeeSelector
              selectedEmployee={selectedEmployee}
              setSelectedEmployee={handleEmployeeChange}
            />
            <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
              <span>Actif: {currentEmployee.name}</span>
              <span className="text-xs text-gray-400 px-1 bg-gray-100 rounded">
                ID: {selectedEmployee}
              </span>
            </div>
          </div>
          <div className="flex-grow overflow-y-auto p-2">
            <ThreadList key={`threads-${selectedEmployee}`} />
          </div>
        </div>
        <ChatView selectedEmployee={selectedEmployee} />
      </div>
    </AssistantRuntimeProvider>
  );
}

// Main ChatPage component
export default function ChatPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to selection</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="text-blue-600 font-semibold">Plumber AI</div>
              <SignedOut>
                <SignInButton mode="modal" />
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Main content wrapped in Suspense */}
      <Suspense fallback={<div>Loading...</div>}>
        <ChatPageContent />
      </Suspense>
    </div>
  );
}

// ChatView remains unchanged
function ChatView({ selectedEmployee }: { selectedEmployee: string }) {
  const threadRuntime = useThreadRuntime();
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const previousThreadIdRef = useRef<string | undefined>(undefined);
  const autoLoadedShortThreadRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const preloadConversations = async () => {
      try {
        const response = await fetch("/api/chat/conversations");
      } catch (error) {
        console.error("Failed to preload conversations:", error);
      }
    };
    preloadConversations();
  }, []);

  useEffect(() => {
    const initialThreadId = threadRuntime.getState().threadId;
    previousThreadIdRef.current = initialThreadId;
    autoLoadedShortThreadRef.current = undefined;

    const handleRuntimeUpdate = () => {
      const currentState = threadRuntime.getState();
      const currentThreadId = currentState.threadId;
      const currentMessages = currentState.messages;

      if (currentThreadId !== previousThreadIdRef.current) {
        console.log(
          "[ChatView] Thread ID changed from",
          previousThreadIdRef.current,
          "to",
          currentThreadId
        );

        const isNewThread = currentThreadId?.startsWith("__LOCALID_");

        if (!isNewThread && currentThreadId) {
          setIsLoadingConversation(true);
          loadHistoryOptimistically(currentThreadId);
        } else {
          setIsLoadingConversation(false);
        }

        previousThreadIdRef.current = currentThreadId;
        autoLoadedShortThreadRef.current = undefined;
      }

      if (
        currentThreadId &&
        currentMessages &&
        currentMessages.length > 0 &&
        currentMessages.length < 10 &&
        autoLoadedShortThreadRef.current !== currentThreadId
      ) {
        console.log(
          "[ChatView] Short thread detected, auto-loading older messages for",
          currentThreadId
        );
        handleLoadOlderMessages();
        autoLoadedShortThreadRef.current = currentThreadId;
      }
    };

    const loadHistoryOptimistically = async (threadId: string) => {
      if (threadId.startsWith("__LOCALID_")) {
        setIsLoadingConversation(false);
        return;
      }

      try {
        const recentResponse = await fetch(
          `/api/chat/history?conversationId=${threadId}&recent=true&limit=10`
        );

        if (recentResponse.ok) {
          const recentHistory = await recentResponse.json();
          setIsLoadingConversation(false);
          if (recentHistory.hasMore) {
            setTimeout(async () => {
              try {
                const fullResponse = await fetch(
                  `/api/chat/history?conversationId=${threadId}&limit=50`
                );
                if (fullResponse.ok) {
                  const fullHistory = await fullResponse.json();
                }
              } catch (error) {
                console.error("Failed to load full history in background:", error);
              }
            }, 100);
          }
        } else {
          setIsLoadingConversation(false);
        }
      } catch (error) {
        console.error("Failed to load history optimistically:", error);
        setIsLoadingConversation(false);
      }
    };

    handleRuntimeUpdate();
    const unsubscribe = threadRuntime.subscribe(handleRuntimeUpdate);
    return () => unsubscribe();
  }, [threadRuntime]);

  async function fetchOlderMessages(
    threadId: string,
    beforeMessageId?: string
  ): Promise<ThreadMessage[]> {
    console.log(
      `Fetching older messages for thread ${threadId} before message ${beforeMessageId}`
    );

    try {
      const params = new URLSearchParams({
        conversationId: threadId,
        limit: "20",
        ...(beforeMessageId && { beforeMessageId }),
      });

      const response = await fetch(`/api/chat/history?${params}`);
      const data = await response.json();

      if (!data || !Array.isArray(data.messages)) {
        console.warn("Invalid response structure:", data);
        return [];
      }

      const threadMessages: ThreadMessage[] = data.messages.map(
        (msg: CoreMessage) => ({
          id: crypto.randomUUID(),
          role: msg.role,
          content: [{ type: "text", text: msg.content }],
          createdAt: new Date(),
        })
      );

      return threadMessages;
    } catch (error) {
      console.error("Error fetching older messages:", error);
      return [];
    }
  }

  const handleLoadOlderMessages = async () => {
    if (!threadRuntime || isLoadingOlderMessages) return;

    const currentThreadState = threadRuntime.getState();
    const currentMessages = currentThreadState.messages;

    if (currentMessages.length === 0) {
      console.log("No current messages to paginate from.");
      return;
    }

    const oldestMessageId = currentMessages[0]?.id;

    if (!currentThreadState.threadId) {
      console.error("No active thread ID found in runtime.");
      return;
    }
    if (!oldestMessageId) {
      console.warn("Could not determine oldest message ID to paginate from.");
    }

    setIsLoadingOlderMessages(true);
    try {
      const olderMessagesBatch = await fetchOlderMessages(
        currentThreadState.threadId,
        oldestMessageId
      );

      if (olderMessagesBatch.length > 0) {
        console.log(
          "Placeholder: Older messages fetched. Integration using runtime.import() would happen here.",
          olderMessagesBatch
        );
      } else {
        console.log("No more older messages found.");
      }
    } catch (error) {
      console.error("Failed to load older messages:", error);
    } finally {
      setIsLoadingOlderMessages(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="border-b border-gray-200 p-3 bg-white">
        <h2 className="font-medium">
          Conversation with{" "}
          {employees.find((e) => e.id === selectedEmployee)?.name ||
            "Assistant"}
        </h2>
      </div>
      <div className="flex-grow relative overflow-hidden">
        {isLoadingConversation ? (
          <div className="flex items-center justify-center h-full bg-white">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">
                Loading conversation...
              </span>
            </div>
          </div>
        ) : (
          <Thread
            employeeId={selectedEmployee}
            isLoadingConversation={isLoadingConversation}
          />
        )}
      </div>
    </div>
  );
}