"use client";

import { useEffect, useState, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserIcon } from "lucide-react";

export const employees = [
  {
    id: "alex",
    name: "Alex",
    description:
      "Business growth and scaling expert. Specializes in the $5M business model, strategic pricing, getting started fundamentals, and long-term vision development.",
    expertise: "Business Strategy & Growth",
    keyAreas: ["Business scaling", "Strategic pricing", "Getting started", "Long-term planning"],
    suggestedQuestions: [
      "How can I develop a 5-year business plan?",
      "What strategies can improve my company's operational efficiency?", 
      "How do I create a compelling vision for my team?",
    ],
  },
  {
    id: "chloe", 
    name: "Chloe",
    description:
      "Digital marketing specialist for plumbing businesses. Expert in Google Local Services Ads, Google Search Ads, SEO, retargeting, and social media marketing.",
    expertise: "Digital Marketing",
    keyAreas: ["Google Ads", "SEO", "Social media", "Lead generation"],
    suggestedQuestions: [
      "How can I improve my Google Ads performance?",
      "What are effective SEO strategies for my service business?",
      "How do I create a content marketing plan that converts?",
    ],
  },
  {
    id: "jake",
    name: "Jake", 
    description:
      "Team building and operations expert. Specializes in hiring strategies, service call management, CSR systems, and creating Standard Operating Procedures.",
    expertise: "Team Building & Operations",
    keyAreas: ["Hiring", "Service calls", "SOPs", "Team management"],
    suggestedQuestions: [
      "How do I create an effective customer service system?",
      "What's the best way to develop SOPs for my technicians?",
      "How can I improve my scheduling efficiency?",
    ],
  },
  {
    id: "lucy",
    name: "Lucy",
    description:
      "Price book and sales specialist. Expert in building custom price books, implementing sales strategies, and the RISE sales system for plumbing businesses.",
    expertise: "Sales & Pricing",
    keyAreas: ["Price books", "Sales techniques", "Value presentation", "Customer relations"],
    suggestedQuestions: [
      "How do I create a profitable pricing structure?",
      "What techniques help technicians sell more effectively?",
      "How can I build a comprehensive pricebook?",
    ],
  },
  {
    id: "nathan",
    name: "Nathan",
    description:
      "ServiceTitan expert and tech specialist. Guides on complete ServiceTitan setup, integrations, automations, and leveraging technology for business growth.",
    expertise: "Technology & ServiceTitan",
    keyAreas: ["ServiceTitan setup", "Business automation", "Tech integration", "Digital tools"],
    suggestedQuestions: [
      "How can I optimize my ServiceTitan setup?",
      "What automations should I implement in my CRM?",
      "How do I train my team on our new software tools?",
    ],
  },
  {
    id: "ben",
    name: "Ben", 
    description:
      "Vehicle fleet management specialist. Expert in building and managing service vehicle fleets, including acquisition strategies, financing, and maintenance.",
    expertise: "Fleet Management",
    keyAreas: ["Vehicle acquisition", "Fleet financing", "Maintenance", "Logistics"],
    suggestedQuestions: [
      "What's the optimal tool setup for service vans?",
      "How should I organize my fleet maintenance program?",
      "What should I include in field technician kits?",
    ],
  },
  {
    id: "elise",
    name: "Elise",
    description:
      "Financial management specialist for plumbing contractors. Expert in P&L analysis, Profit First system, cash flow management, and financial organization.",
    expertise: "Financial Management", 
    keyAreas: ["P&L analysis", "Profit First", "Cash flow", "Financial planning"],
    suggestedQuestions: [
      "How do I improve my company's cash-flow management?",
      "What are the best practices for tax filing and compliance?",
      "How can I optimize my financial reporting processes?",
    ],
  },
];

export const EmployeeSelector = ({
  selectedEmployee,
  setSelectedEmployee,
}: {
  selectedEmployee: string;
  setSelectedEmployee: (value: string) => void;
}) => {
  // Internal state to ensure UI updates correctly
  const [localValue, setLocalValue] = useState(selectedEmployee);
  const syncInProgressRef = useRef(false);

  // Force sync local state with parent state when props change
  // This is crucial for proper synchronization
  useEffect(() => {
    if (selectedEmployee !== localValue && !syncInProgressRef.current) {
      console.log(
        `SELECTOR SYNC - External value changed: ${selectedEmployee}`
      );
      setLocalValue(selectedEmployee);
    }
  }, [selectedEmployee, localValue]);

  // Handle value change with direct update of both local and parent state
  const handleValueChange = (value: string) => {
    console.log("SELECT", value);
    console.log(`SELECTOR CHANGE - User selected: ${value}`);

    // Prevent sync loop
    syncInProgressRef.current = true;

    // Update local state for immediate UI feedback
    setLocalValue(value);

    // Update parent state to propagate change
    setSelectedEmployee(value);

    // Allow future syncs
    setTimeout(() => {
      syncInProgressRef.current = false;
    }, 50);
  };

  // Find and display the current employee name
  const currentEmployee =
    employees.find((e) => e.id === localValue) || employees[0];

  // Debug rendering
  console.log(`SELECTOR RENDER - Current value: ${localValue}`);

  return (
    <div>
      <Select
        value={localValue}
        onValueChange={handleValueChange}
        onOpenChange={(open) => {
          if (!open) {
            // Force refresh when dropdown closes to ensure consistency
            console.log(`SELECTOR CLOSE - Syncing to: ${selectedEmployee}`);
            setLocalValue(selectedEmployee);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            <span className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              {currentEmployee.name}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {employees.map((employee) => (
            <SelectItem
              key={employee.id}
              value={employee.id}
              // Force highlight of the current selected value
              className={employee.id === localValue ? "bg-blue-50" : ""}
            >
              <span className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                {employee.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
