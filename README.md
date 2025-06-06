# synaps
Link: https://synaps-ai.vercel.app
A project management application featuring an AI-powered task assistant that leverages the Gemini API. Synaps helps you organize projects and automatically generate tasks through natural language conversations.

## Tech Stack

### Frontend
- **React 19**: Latest version for building the user interface
- **Next.js 15.3**: Framework for server-side rendering and API routes
- **Tailwind CSS**: For utility-first styling
- **TypeScript**: For type-safe code
- **Zustand**: For state management
- **shadcn**: For UI components

### Backend & Services
- **Supabase**: For authentication and database (with Row Level Security)
- **Google Gemini API**: For AI-powered conversations and task suggestions
- **Next.js API Routes**: For serverless backend functionality

### Development Tools
- **ESLint**: For code linting
- **TypeScript**: For static type checking

## Deployment

The application is deployed on Vercel.
## Features

- **AI-Powered Task Generation**: Utilizes Google's Gemini API to suggest relevant tasks based on project context
- **Smart Task Extraction**: Automatically identifies and extracts tasks from AI responses
- **Project Management**: Create and manage multiple projects with associated tasks
- **Real-time Chat History**: Maintains conversation context with persistent chat history
- **Task Management**: Add, edit, delete, and mark tasks as complete
- **Deadline Tracking**: Set and manage task deadlines
- **Modern UI**: Responsive and intuitive interface built with Tailwind CSS
- **Secure Authentication**: User authentication and data protection with Supabase

## Usage

1. **Sign In**: Authenticate using Supabase authentication
2. **Create Project**: Create a new project with name and description
3. **Generate Tasks**: Use the AI assistant to suggest tasks based on your project
4. **Manage Tasks**: Add, edit, or complete tasks as your project progresses
5. **Track Progress**: Monitor project progress through task completion
