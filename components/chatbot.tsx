'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useChatbotStore } from '@/store/useChatbotStore';
import { useProjectStore } from '@/store/useMainStore';
import { useUserStore } from '@/store/useUserStore';
import { useTaskStore } from '@/store/useTaskStore';

export default function Chatbot() {
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<{ title: string; deadline: string | null }[]>([]);
  const [addingTasks, setAddingTasks] = useState(false);
  const autoSendRef = useRef(false);

  const { inputTemplate, setInputTemplate } = useChatbotStore();
  const { selectedProject } = useProjectStore();
  const { user } = useUserStore();
  const { addTask } = useTaskStore();

  useEffect(() => {
    // Autofill the input field with the stored template (if any)
    if (inputTemplate) {
      setInput(inputTemplate);
      // Set flag to auto-send after state update
      autoSendRef.current = true;
      // Clear the template after setting it
      setInputTemplate('');
    }
  }, [inputTemplate, setInputTemplate]);

  // Effect to handle auto-sending
  useEffect(() => {
    if (autoSendRef.current && input) {
      const templateMessage = input; // Capture the template content
      autoSendRef.current = false; // Reset the flag
      // Send the template, marking it as the initial auto-send interaction
      // where both user prompt and bot's direct response should be hidden from chat log
      sendMessage(templateMessage, true); 
    }
  }, [input]);

  const extractTasksFromResponse = (text: string) => {
    const tasks: { title: string; deadline: string | null }[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const taskMatch = line.match(/^[•-]\s*(.+?)(?:\s*\(due:\s*([^)]+)\))?$/);
      if (taskMatch) {
        tasks.push({
          title: taskMatch[1].trim(),
          deadline: taskMatch[2] ? new Date(taskMatch[2]).toISOString() : null
        });
      }
    }
    
    return tasks;
  };

  const addTasksToProject = async () => {
    if (!selectedProject || !user || extractedTasks.length === 0) return;
    
    setAddingTasks(true);
    
    try {
      // Transform tasks to ensure deadline is properly formatted
      const tasksToAdd = extractedTasks.map(task => ({
        title: task.title,
        deadline: task.deadline
      }));

      console.log('Sending tasks to API:', {
        project_id: selectedProject.id,
        user_email: user.email,
        tasks: tasksToAdd
      });
      
      const res = await axios.post('/api/add-multiple-tasks', {
        project_id: selectedProject.id,
        user_email: user.email,
        tasks: tasksToAdd
      });
      
      console.log('API response:', res.data);
      
      if (res.status === 200) {
        // Add tasks to Zustand store
        if (res.data.data) {
          res.data.data.forEach((task: any) => {
            addTask(task);
          });
        }

        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: `✅ Successfully added ${extractedTasks.length} tasks to your project!`
          }
        ]);
        setExtractedTasks([]);
      }
    } catch (error: any) {
      console.error('Error adding tasks:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Something went wrong';
      
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `Error adding tasks: ${errorMessage}`
        }
      ]);
    } finally {
      setAddingTasks(false);
    }
  };

  const sendMessage = async (messageContent: string = input, isInitialAutoSend: boolean = false) => {
    if (!messageContent.trim()) return;

    // Only add the user's message to the UI if it's NOT the initial auto-send
    if (!isInitialAutoSend) {
      const userMessage: { sender: 'user' | 'bot'; text: string } = { sender: 'user', text: messageContent };
      setMessages(prev => [...prev, userMessage]);
    }

    // Clear the input field if the messageContent was what's currently in the input
    // This handles both auto-sent templates and user-typed messages.
    if (messageContent === input) {
      setInput('');
    }
    
    setLoading(true);
    setExtractedTasks([]); // Clear previous tasks when a new message is sent

    try {
      const res = await axios.post('/api/gemini', { message: messageContent });
      const botResponseText = res.data.text;

      // Only add the bot's direct response to the UI if it's NOT the initial auto-send
      if (!isInitialAutoSend) {
        const botMessage: { sender: 'user' | 'bot'; text: string } = { sender: 'bot', text: botResponseText };
        setMessages(prev => [...prev, botMessage]);
      }
      
      // Always extract potential tasks from the bot's response if the prompt was about tasks
      if (messageContent.toLowerCase().includes('task') && selectedProject) {
        const tasks = extractTasksFromResponse(botResponseText);
        if (tasks.length > 0) {
          setExtractedTasks(tasks);
        }
      }
    } catch (error: any) {
      console.error('Error sending message or processing response:', error);
      const errorMessageText = `Error: ${error?.response?.data?.error || error?.message || 'Something went wrong.'}`;
      // Always show error messages in the chat
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: errorMessageText,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white shadow-lg border border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-500 to-blue-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Chat with Gemini</h2>
            <p className="text-sm text-blue-100">AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.sender === 'user' 
                  ? 'bg-blue-500 text-white rounded-br-none' 
                  : 'bg-white text-slate-800 rounded-bl-none shadow-sm border border-slate-200'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-800 rounded-2xl rounded-bl-none px-4 py-2.5 shadow-sm border border-slate-200">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {extractedTasks.length > 0 && (
          <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium text-green-800">Suggested Tasks</p>
            </div>
            <ul className="space-y-2 mb-4">
              {extractedTasks.map((task, index) => (
                <li key={index} className="flex items-start gap-2 text-slate-700">
                  <span className="text-green-500 mt-1">•</span>
                  <div className="flex-1">
                    <span className="text-sm">{task.title}</span>
                    {task.deadline && (
                      <div className="flex items-center gap-1 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-slate-500">
                          Due: {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <button
              onClick={addTasksToProject}
              disabled={addingTasks}
              className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {addingTasks ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Tasks...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Tasks to Project
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
          />
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            <span>Send</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
