export interface AIResponse {
    suggestion: string;
    explanation: string;
}

export const askGemini = async (query: string): Promise<AIResponse> => {
    // Mock implementation for Gemini 3
    console.log("Querying Gemini 3 with:", query);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (query.includes("git")) {
        return {
            suggestion: "git status",
            explanation: "Checks the status of your working directory."
        };
    }

    return {
        suggestion: "echo 'Hello Aether'",
        explanation: "A simple command to print text to the terminal."
    };
};
