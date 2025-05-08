'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useChatbotStore } from '@/store/useChatbotStore';
import { useProjectStore } from '@/store/useMainStore';
import { useUserStore } from '@/store/useUserStore';

export default function Chatbot() {
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<string[]>([]);
  const [addingTasks, setAddingTasks] = useState(false);
  const autoSendRef = useRef(false);

  const { inputTemplate, setInputTemplate } = useChatbotStore();
  const { selectedProject } = useProjectStore();
  const { user } = useUserStore();

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
  }, [input]); // Triggered when input (which becomes the template) changes

  // Extract tasks from Gemini's response
  const extractTasksFromResponse = (text: string): string[] => {
    // Look for numbered or bulleted lists
    const taskRegex = /(?:^|\n)(?:\d+\.|\*|\-)\s*(.+?)(?=\n|$)/g;
    const matches = [...text.matchAll(taskRegex)];
    
    if (matches.length > 0) {
      return matches.map(match => match[1].trim());
    }
    
    // If no list format is found, try to split by newlines and filter out short lines
    const lines = text.split('\n').map(line => line.trim())
      .filter(line => line.length > 10 && !line.startsWith('Here') && !line.startsWith('These') && !line.includes(':'));
    
    return lines;
  };

  const addTasksToProject = async () => {
    if (!selectedProject || !user || extractedTasks.length === 0) return;
    
    setAddingTasks(true);
    
    try {
      console.log('Sending tasks to API:', {
        project_id: selectedProject.id,
        user_email: user.email,
        tasks: extractedTasks
      });
      
      const res = await axios.post('/api/add-multiple-tasks', {
        project_id: selectedProject.id,
        user_email: user.email,
        tasks: extractedTasks
      });
      
      console.log('API response:', res.data);
      
      if (res.status === 200) {
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

  // Added isInitialAutoSend flag:
  // - If true, it means this is the automated "Ask Gemini" flow.
  //   - The user's initial prompt (template) will NOT be added to messages.
  //   - The bot's direct response to this prompt will also NOT be added to messages.
  //   - However, tasks WILL be extracted from the bot's response.
  // - If false (default), it's a regular user-typed message, and all messages are shown.
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
  };

  return (
    <div className="max-w-xl mx-auto p-4 border rounded-lg shadow space-y-4">
      <h2 className="text-xl font-bold">Chat with Gemini</h2>
      <div className="h-96 overflow-y-auto bg-gray-100 p-4 rounded">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block px-3 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-black border'}`}>
              {msg.text}
            </span>
          </div>
        ))}
        {loading && <div className="text-gray-500">Thinking...</div>}
        
        {extractedTasks.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="font-medium text-green-800 mb-2">My advice is do these {extractedTasks.length} potential tasks:</p>
            <ul className="list-disc pl-5 mb-3">
              {extractedTasks.map((task, index) => (
                <li key={index} className="text-green-700">{task}</li>
              ))}
            </ul>
            <button
              onClick={addTasksToProject}
              disabled={addingTasks}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
            >
              {addingTasks ? 'Adding...' : 'Add These Tasks to Project'}
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          // Calls sendMessage() which defaults isInitialAutoSend to false
          onKeyDown={e => e.key === 'Enter' && sendMessage()} 
          placeholder="Type a message..."
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          // Calls sendMessage() which defaults isInitialAutoSend to false
          onClick={() => sendMessage()} 
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
