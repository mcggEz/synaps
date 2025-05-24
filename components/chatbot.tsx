'use client';
import { useState, useEffect, useRef } from 'react';
import { useChatbotStore } from '@/store/useChatbotStore';
import { useProjectStore } from '@/store/useMainStore';
import { useUserStore } from '@/store/useUserStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useChatHistoryStore } from '@/store/useChatHistoryStore';

export default function Chatbot() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<{ title: string; deadline: string | null }[]>([]);
  const [addingTasks, setAddingTasks] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isStoreHydrated, setIsStoreHydrated] = useState(false);
  const autoSendRef = useRef(false);

  const { inputTemplate, setInputTemplate } = useChatbotStore();
  const { selectedProject } = useProjectStore();
  const { user } = useUserStore();
  const { addTask } = useTaskStore();
  const { chatHistory, addMessage, getProjectHistory, clearProjectHistory, clearAllHistory } = useChatHistoryStore();

  useEffect(() => {
    if (useChatHistoryStore.persist.hasHydrated()) {
      setIsStoreHydrated(true);
    } else {
      const unsubscribe = useChatHistoryStore.persist.onFinishHydration(() => {
        setIsStoreHydrated(true);
      });
      return () => {
        unsubscribe();
      };
    }
  }, []);

  // Load chat history when project changes and store is hydrated
  useEffect(() => {
    if (selectedProject && user && isStoreHydrated) {
      loadChatHistory();
    }
  }, [selectedProject?.id, isStoreHydrated]);

  const loadChatHistory = async () => {
    if (!selectedProject || !user) return;

    try {
      console.log('Loading chat history for project:', selectedProject.id);
      const response = await fetch(`/api/chat-history?project_id=${selectedProject.id}&user_email=${user.email}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Received chat history:', data);
        // Clear existing history for this project
        clearProjectHistory(selectedProject.id);
        // Add all messages to the store
        data.forEach((msg: any) => {
          addMessage(selectedProject.id, {
            sender: msg.sender,
            text: msg.text,
            timestamp: msg.timestamp
          });
        });
        console.log('Updated chat history in store:', getProjectHistory(selectedProject.id));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  useEffect(() => {
    if (inputTemplate) {
      setInput(inputTemplate);
      autoSendRef.current = true;
      setInputTemplate('');
    }
  }, [inputTemplate, setInputTemplate]);

  useEffect(() => {
    if (autoSendRef.current && input) {
      const templateMessage = input;
      autoSendRef.current = false;
      sendMessage(templateMessage, true);
    }
  }, [input]);

  const extractTasksFromResponse = (text: string) => {
    const tasks: { title: string; deadline: string | null }[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Match both numbered tasks (1. Task name) and bullet points (• Task name)
      const taskMatch = line.match(/^[•\d+\.]\s*(.+?)(?:\s*\(due:\s*([^)]+)\))?$/);
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
      const tasksToAdd = extractedTasks.map(task => ({
        title: task.title,
        deadline: task.deadline
      }));
      
      const res = await fetch('/api/add-multiple-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: selectedProject.id,
          user_email: user.email,
          tasks: tasksToAdd
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          data.data.forEach((task: any) => {
            addTask(task);
          });
        }

        const successMessage = {
          sender: 'bot' as const,
          text: `✅ Successfully added ${extractedTasks.length} tasks to your project!`,
          timestamp: new Date().toISOString()
        };

        addMessage(selectedProject.id, successMessage);
        await fetch('/api/chat-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project_id: selectedProject.id,
            user_email: user.email,
            message: successMessage
          })
        });

        setExtractedTasks([]);
      }
    } catch (error: any) {
      console.error('Error adding tasks:', error);
      const errorMessage = error.message || 'Something went wrong';
      
      const errorMsg = {
        sender: 'bot' as const,
        text: `Error adding tasks: ${errorMessage}`,
        timestamp: new Date().toISOString()
      };

      addMessage(selectedProject.id, errorMsg);
      await fetch('/api/chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: selectedProject.id,
          user_email: user.email,
          message: errorMsg
        })
      });
    } finally {
      setAddingTasks(false);
    }
  };

  const sendMessage = async (messageContent: string = input, isInitialAutoSend: boolean = false) => {
    if (!messageContent.trim() || !selectedProject || !user) return;

    // Create a more detailed prompt with project context if it's a task-related query
    const shouldAddContext = messageContent.toLowerCase().includes('task') || isInitialAutoSend;
    const enhancedMessage = shouldAddContext ? 
      `Based on this project:
Title: ${selectedProject.name}
Description: ${selectedProject.description}

${messageContent}

Please provide a list of tasks that would help complete this project. For each task, include a suggested deadline if applicable. Format each task as a numbered or bulleted item, and if you suggest a deadline, include it in parentheses like this: "Task name (due: YYYY-MM-DD)".` 
      : messageContent;

    const userMessage = {
      sender: 'user' as const,
      text: messageContent, // Store original message in history
      timestamp: new Date().toISOString()
    };

    if (!isInitialAutoSend) {
      addMessage(selectedProject.id, userMessage);
      await fetch('/api/chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: selectedProject.id,
          user_email: user.email,
          message: userMessage
        })
      });
    }

    if (messageContent === input) {
      setInput('');
    }
    
    setLoading(true);
    setExtractedTasks([]);

    try {
      // Get the last 5 messages for context
      const projectMessages = getProjectHistory(selectedProject.id);
      const recentMessages = projectMessages.slice(-5);
      const contextMessages = recentMessages.map((msg: { sender: 'user' | 'bot'; text: string }) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      // Add the current message to the context
      contextMessages.push({
        role: 'user',
        content: enhancedMessage // Use enhanced message for Gemini
      });

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: enhancedMessage,
          context: contextMessages
        })
      });

      if (!res.ok) {
        throw new Error('Failed to get response from Gemini');
      }

      const data = await res.json();
      const botResponseText = data.text;

      const botMessage = {
        sender: 'bot' as const,
        text: botResponseText,
        timestamp: new Date().toISOString()
      };

      addMessage(selectedProject.id, botMessage);
      await fetch('/api/chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: selectedProject.id,
          user_email: user.email,
          message: botMessage
        })
      });
      
      // Check for tasks in the response if it's a task-related query
      if (shouldAddContext) {
        const tasks = extractTasksFromResponse(botResponseText);
        if (tasks.length > 0) {
          setExtractedTasks(tasks);
        }
      }
    } catch (error: any) {
      console.error('Error sending message or processing response:', error);
      const errorMessageText = `Error: ${error.message || 'Something went wrong.'}`;
      
      const errorMsg = {
        sender: 'bot' as const,
        text: errorMessageText,
        timestamp: new Date().toISOString()
      };

      addMessage(selectedProject.id, errorMsg);
      await fetch('/api/chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: selectedProject.id,
          user_email: user.email,
          message: errorMsg
        })
      });
    } finally {
      setLoading(false);
    }
  };

  const currentMessages = selectedProject ? getProjectHistory(selectedProject.id) : [];
  console.log('Current messages to render:', currentMessages);

  // Add new function to handle clearing all history
  const handleClearAllHistory = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/chat-history/clear-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_email: user.email })
      });

      if (response.ok) {
        clearAllHistory();
        setNotification({ message: 'All chat history has been cleared', type: 'success' });
        // Remove notification after 3 seconds
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
      setNotification({ message: 'Failed to clear chat history', type: 'error' });
      // Remove notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-[400px] bg-white shadow-lg border border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-800 truncate">Chat with Gemini</h2>
              <p className="text-sm text-gray-500 truncate">AI Assistant</p>
            </div>
          </div>
          <button
            onClick={handleClearAllHistory}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Clear all chat history"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentMessages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                msg.sender === 'user' 
                  ? 'bg-blue-500 text-white rounded-br-none' 
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {msg.text.split('\n').map((line, index) => {
                  // Check if line is a project detail
                  if (line.startsWith('Project ID:') || line.startsWith('Project Name:') || line.startsWith('Project Description:')) {
                    return (
                      <div key={index} className="mb-1">
                        <span className="font-medium">{line.split(':')[0]}:</span>
                        <span className="ml-1">{line.split(':')[1]}</span>
                      </div>
                    );
                  }
                  // Check if line is a numbered task or bullet point
                  else if (line.match(/^\d+\./) || line.startsWith('•')) {
                    return (
                      <div key={index} className="ml-4 mb-1">
                        {line}
                      </div>
                    );
                  }
                  // Regular text
                  return <div key={index}>{line}</div>;
                })}
              </div>
              <span className="text-xs opacity-70 mt-1 block">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-none px-4 py-2.5">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {extractedTasks.length > 0 && (
          <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium text-gray-800 truncate">Suggested Tasks</p>
            </div>
            <ul className="space-y-2 mb-4">
              {extractedTasks.map((task, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <span className="text-gray-500 mt-1 shrink-0">•</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm break-words">{task.title}</span>
                    {task.deadline && (
                      <div className="flex items-center gap-1 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-500 truncate">
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
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {addingTasks ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="truncate">Adding Tasks...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="truncate">Add Tasks to Project</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-shadow"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
          />
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
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

      {/* Notification */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ease-in-out ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
          style={{
            animation: 'fadeInOut 3s ease-in-out',
            zIndex: 9999
          }}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
