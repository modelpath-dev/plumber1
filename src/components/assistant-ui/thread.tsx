import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import type { FC } from "react";
import {
  ArrowDownIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PencilIcon,
  RefreshCwIcon,
  SendHorizontalIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { SuggestedQuestions } from "@/components/SuggestedQuestions";
import { employees } from "@/components/EmployeeSelector";

export interface ThreadProps {
  employeeId?: string;
  isLoadingConversation?: boolean;
}

export const Thread: FC<ThreadProps> = ({
  employeeId = "sales",
  isLoadingConversation = false,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const previousEmployeeIdRef = useRef(employeeId);
  const mountTimeRef = useRef(Date.now());
  const mountId = useRef(`thread-${Math.random().toString(36).slice(2, 9)}`);

  // Get employee name for better logging
  const employeeName =
    employees.find((e) => e.id === employeeId)?.name || "Unknown";

  // Determine if this is a new thread (could be based on empty messages or other criteria)
  const isNewThread = employeeId.startsWith("__LOCALID_");
  // You may want to derive this from ThreadPrimitive state

  // Reset state and ensure clean transition when employeeId changes
  useEffect(() => {
    // Capture current values to use in cleanup function
    const startTime = mountTimeRef.current;
    const instanceId = mountId.current;
    const currentEmployeeId = employeeId;

    // Log essential info for debugging
    console.log(
      `THREAD [${instanceId}] - Received employeeId: ${currentEmployeeId} (${employeeName})`
    );
    console.log(
      `THREAD [${instanceId}] - Previous employeeId: ${previousEmployeeIdRef.current}`
    );

    // Handle employee ID change
    if (previousEmployeeIdRef.current !== employeeId) {
      console.log(
        `THREAD [${instanceId}] - EMPLOYEE CHANGED from ${previousEmployeeIdRef.current} to ${currentEmployeeId}`
      );

      // Reset suggestions state when employeeId changes
      setShowSuggestions(true);
      previousEmployeeIdRef.current = employeeId;
    }

    // Force cleanup on unmount - using captured variables
    return () => {
      const activeMs = Date.now() - startTime;
      console.log(
        `THREAD [${instanceId}] - UNMOUNTING, was active for: ${activeMs}ms with employeeId: ${currentEmployeeId}`
      );
    };
  }, [employeeId, employeeName]);

  // Delay showing empty state to avoid flash on old chats
  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    if (!isLoadingConversation) {
      timeout = setTimeout(() => setShowEmptyState(true), 3300);
    } else {
      setShowEmptyState(false);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoadingConversation]);

  return (
    <ThreadPrimitive.Root
      className="bg-background box-border flex h-full flex-col overflow-hidden"
      style={{
      ["--thread-max-width" as string]: "42rem",
      }}
      data-employee-id={employeeId}
    >
      {isLoadingConversation ? (
      <div className="flex flex-1 items-center justify-center w-full h-full">
        <div className="flex items-center gap-2">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">
          Loading conversation...
        </span>
        </div>
      </div>
      ) : (
      <ThreadPrimitive.Viewport className="flex h-full flex-col items-center overflow-y-scroll  scroll-smooth bg-inherit px-4 pt-8">
        <ThreadWelcome
        employeeId={employeeId}
        showSuggestions={showSuggestions}
        onDismissSuggestions={() => setShowSuggestions(false)}
        key={`welcome-${employeeId}`}
        showWelcome={!isLoadingConversation && isNewThread}
        />

        <ThreadPrimitive.Messages
        components={{
          UserMessage: UserMessage,
          EditComposer: EditComposer,
          AssistantMessage: AssistantMessage,
        }}
        />

        <ThreadPrimitive.If empty={false}>
        <div className="min-h-8 flex-grow" />
        <div className="sticky bottom-0 mt-3 flex w-full max-w-[var(--thread-max-width)] flex-col items-center justify-end rounded-t-lg bg-inherit pb-4">
          <ThreadScrollToBottom />
          <Composer />
        </div>
        </ThreadPrimitive.If>
        {showEmptyState && (
        <ThreadPrimitive.If empty={true}>
          <div className="min-h-8 flex-grow" />
          <div className="sticky bottom-0 mt-3 flex w-full max-w-[var(--thread-max-width)] flex-col items-center justify-end rounded-t-lg bg-inherit pb-4 gap-4">
          <ThreadScrollToBottom />
          <SuggestedQuestions
            key={`suggestions-${employeeId}`}
            employeeId={employeeId}
            onDismiss={() => setShowSuggestions(false)}
          />
          <Composer />
          </div>
        </ThreadPrimitive.If>
        )}

        {/* Only show Composer for new threads (welcome screen visible) */}
        {/* {isNewThread && (
        <div className="sticky bottom-0 mt-3 flex w-full max-w-[var(--thread-max-width)] flex-col items-center justify-end rounded-t-lg bg-inherit pb-4">
          <ThreadScrollToBottom />
          <Composer />
        </div>
        )} */}
      </ThreadPrimitive.Viewport>
      )}
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="absolute -top-8 rounded-full disabled:invisible"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

type ThreadWelcomeProps = {
  employeeId: string;
  showSuggestions: boolean;
  onDismissSuggestions: () => void;
  showWelcome: boolean;
};

const ThreadWelcome: FC<ThreadWelcomeProps> = ({
  employeeId,
  showSuggestions,
  onDismissSuggestions,
  showWelcome,
}) => {
  if (!showWelcome) return null;
  return (
    <ThreadPrimitive.Empty>
      {/* Only show welcome content when not loading */}
      <ThreadPrimitive.If running={false}>
        <div className="flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col">
          <div className="flex w-full flex-grow flex-col items-center justify-center">
            <p className="mt-4 font-medium">How can I help you today?</p>
          </div>
          {/* Only render one suggestions component at a time with a unique key */}
          {showSuggestions && employeeId && (
            <div className="w-full mt-4">
              <SuggestedQuestions
                key={`thread-welcome-${employeeId}`}
                employeeId={employeeId}
                onDismiss={onDismissSuggestions}
              />
            </div>
          )}
        </div>
      </ThreadPrimitive.If>

      {/* Show loading spinner when loading */}
      <ThreadPrimitive.If running>
        <div className="flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">
              Loading conversation...
            </span>
          </div>
        </div>
      </ThreadPrimitive.If>
    </ThreadPrimitive.Empty>
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="focus-within:border-ring/20 flex w-full flex-wrap items-end rounded-lg border bg-inherit px-2.5 shadow-sm transition-colors ease-in">
      <ComposerPrimitive.Input
        rows={1}
        autoFocus
        placeholder="Write a message..."
        className="placeholder:text-muted-foreground max-h-40 flex-grow resize-none border-none bg-transparent px-2 py-4 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed"
      />
      <ComposerAction />
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  return (
    <>
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Send"
            variant="default"
            className="my-2.5 size-8 p-2 transition-opacity ease-in"
          >
            <SendHorizontalIcon />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>
      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <TooltipIconButton
            tooltip="Cancel"
            variant="default"
            className="my-2.5 size-8 p-2 transition-opacity ease-in"
          >
            <CircleStopIcon />
          </TooltipIconButton>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="grid auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 [&:where(>*)]:col-start-2 w-full max-w-[var(--thread-max-width)] py-4">
      <UserActionBar />

      <div className="bg-muted text-foreground max-w-[calc(var(--thread-max-width)*0.8)] break-words rounded-3xl px-5 py-2.5 col-start-2 row-start-2">
        <MessagePrimitive.Content />
      </div>

      <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="flex flex-col items-end col-start-1 row-start-2 mr-3 mt-2.5"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="bg-muted my-4 flex w-full max-w-[var(--thread-max-width)] flex-col gap-2 rounded-xl">
      <ComposerPrimitive.Input className="text-foreground flex h-8 w-full resize-none bg-transparent p-4 pb-0 outline-none" />

      <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="ghost">Cancel</Button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild>
          <Button>Send</Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="grid grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] relative w-full max-w-[var(--thread-max-width)] py-4">
      <div className="text-foreground max-w-[calc(var(--thread-max-width)*0.8)] break-words leading-7 col-span-2 col-start-2 row-start-1 my-1.5">
        <MessagePrimitive.Content components={{ Text: MarkdownText }} />
      </div>

      <AssistantActionBar />

      <BranchPicker className="col-start-2 row-start-2 -ml-2 mr-2" />
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="text-muted-foreground flex gap-1 col-start-3 row-start-2 -ml-1 data-[floating]:bg-background data-[floating]:absolute data-[floating]:rounded-md data-[floating]:border data-[floating]:p-1 data-[floating]:shadow-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <MessagePrimitive.If copied>
            <CheckIcon />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "text-muted-foreground inline-flex items-center text-xs",
        className
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

const CircleStopIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      width="16"
      height="16"
    >
      <rect width="10" height="10" x="3" y="3" rx="2" />
    </svg>
  );
};