"use client";

import { employees } from "./EmployeeSelector";
import { ThreadPrimitive } from "@assistant-ui/react";
import { LightbulbIcon, XIcon } from "lucide-react";
import { useEffect, useId } from "react";

type SuggestedQuestionsProps = {
  employeeId: string;
  onDismiss?: () => void;
};

// Keep track of active instances to prevent duplicates
const activeInstances = new Set<string>();

export const SuggestedQuestions = ({
  employeeId,
  onDismiss,
}: SuggestedQuestionsProps) => {
  // Create a unique ID for this instance
  const instanceId = useId();

  // Find the selected employee and their suggested questions
  const selectedEmployee = employees.find((emp) => emp.id === employeeId);

  // Register this instance when mounted and clean up when unmounted
  useEffect(() => {
    // If this instance is already active, it's a duplicate
    if (activeInstances.has(employeeId)) {
      console.warn(`Duplicate suggestion box for ${employeeId} detected`);
    }

    // Register this instance
    activeInstances.add(employeeId);

    // Clean up when unmounted
    return () => {
      activeInstances.delete(employeeId);
    };
  }, [employeeId, instanceId]);

  // Don't render if employee not found
  if (!selectedEmployee) return null;

  return (
    <div className="w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col">
        {/* Header with employee name and dismiss button */}
        <div className="bg-blue-50 p-3 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            <LightbulbIcon className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-medium text-gray-700">
              Ask {selectedEmployee.name} about:
            </h3>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100"
              aria-label="Dismiss suggestions"
            >
              <XIcon className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Question chips/buttons */}
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {selectedEmployee.suggestedQuestions.map((question, index) => (
            <ThreadPrimitive.Suggestion
              key={`${employeeId}-question-${index}`}
              className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-md p-2 text-sm cursor-pointer transition-colors flex items-center"
              prompt={question}
              method="replace"
              autoSend
            >
              <div className="flex items-start">
                <span className="mr-1 text-blue-500 font-medium">&rarr;</span>
                <span>{question}</span>
              </div>
            </ThreadPrimitive.Suggestion>
          ))}
        </div>
      </div>
    </div>
  );
};
