"use client";

import { useRouter } from "next/navigation";
import { employees } from "@/components/EmployeeSelector";
import { ArrowRight, CheckCircle, User, Briefcase } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

// Mapping employees to Mastra agent endpoints
const employeeToAgentMap = {
  "elise": "EliseAgent",
  "nathan": "nathanAgent", 
  "lucy": "lucyAgent",
  "jake": "jakeAgent",
  "chloe": "chloeAgent",
  "ben": "benAgent",
  "alex": "alexAgent",
  // Default to ragAgent if no specific mapping exists
  "default": "ragAgent"
};

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  // Debug logging
  console.log('Component rendered, selectedEmployee:', selectedEmployee);

  // Handle employee selection
  const handleEmployeeSelect = (employeeId: string) => {
    console.log('Selecting employee:', employeeId);
    setSelectedEmployee(employeeId);
  };

  // Navigate to chat with the selected employee and corresponding agent
  const handleGetStarted = () => {
    console.log('handleGetStarted called with selectedEmployee:', selectedEmployee);
    if (selectedEmployee) {
      // Get the corresponding agent for this employee
      const agentName = employeeToAgentMap[selectedEmployee as keyof typeof employeeToAgentMap] || employeeToAgentMap.default;
      console.log('Navigating to chat with agent:', agentName);
      router.push(`/chat?employeeId=${selectedEmployee}&agentName=${agentName}`);
    } else {
      console.log('No employee selected');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Plumber AI
              </div>
            </div>
            <div className="flex items-center gap-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="outline">Sign In</Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Choose Your AI Expert
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get specialized guidance from our team of plumbing business experts powered by AI
          </p>
        </div>

        {/* Agents grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {employees.map((employee) => (
            <Card 
              key={employee.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                selectedEmployee === employee.id
                  ? "ring-2 ring-blue-500 shadow-xl bg-blue-50/50"
                  : "hover:bg-gray-50/50"
              } [&_button]:cursor-pointer`}
              onClick={(e) => {
                console.log('Card clicked for employee:', employee.id, e);
                handleEmployeeSelect(employee.id);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                    selectedEmployee === employee.id 
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500" 
                      : "bg-gradient-to-r from-gray-400 to-gray-500"
                  }`}>
                    {employee.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{employee.name}</CardTitle>
                    <CardDescription className="text-sm font-medium text-blue-600">
                      {employee.expertise}
                    </CardDescription>
                  </div>
                  {selectedEmployee === employee.id && (
                    <CheckCircle className="w-6 h-6 text-blue-500" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {employee.description}
                </p>
                
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Key Areas
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {employee.keyAreas.map((area, index) => (
                      <span 
                        key={index}
                        className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedEmployee === employee.id && (
                  <Button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Button clicked for employee:', employee.id);
                      handleGetStarted();
                    }}
                    className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 cursor-pointer hover:cursor-pointer active:cursor-pointer"
                    style={{ cursor: 'pointer' }}
                  >
                    Start Chat <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA when agent is selected */}
        {selectedEmployee && (
          <div className="text-center">
            <Card className="inline-block p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white">
                  <User className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">
                    Ready to chat with {employees.find((e) => e.id === selectedEmployee)?.name}?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Get expert guidance on {employees.find((e) => e.id === selectedEmployee)?.expertise.toLowerCase()}
                  </p>
                </div>
                <Button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Bottom CTA button clicked for:', selectedEmployee);
                    handleGetStarted();
                  }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 cursor-pointer hover:cursor-pointer active:cursor-pointer"
                  style={{ cursor: 'pointer' }}
                >
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
