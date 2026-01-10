import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Message } from '../types';
import { newsApi } from '../lib/newsApi';

const decodeHTMLEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

export const AIChat = () => {
  const { selectedArticle, showAIChat, setShowAIChat } = useApp();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAIChat && selectedArticle) {
      loadConversationHistory();
    }
  }, [showAIChat, selectedArticle]);

  const loadConversationHistory = async () => {
    if (!selectedArticle) {
      return;
    }

    if (!user) {
      setMessages([
        {
          role: 'assistant',
          content: `I'm here to help you understand this article: "${selectedArticle.title}". What would you like to know?`,
          timestamp: new Date()
        }
      ]);
      return;
    }

    try {
      const history = await newsApi.getConversationHistory(selectedArticle.id);

      if (history.length > 0) {
        const loadedMessages: Message[] = history.map((conv: any) => [
          {
            role: 'user' as const,
            content: conv.question,
            timestamp: new Date(conv.created_at)
          },
          {
            role: 'assistant' as const,
            content: decodeHTMLEntities(conv.answer),
            timestamp: new Date(conv.created_at)
          }
        ]).flat();

        setMessages(loadedMessages);
      } else {
        setMessages([
          {
            role: 'assistant',
            content: `I'm here to help you understand this article: "${selectedArticle.title}". What would you like to know?`,
            timestamp: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
      setMessages([
        {
          role: 'assistant',
          content: `I'm here to help you understand this article: "${selectedArticle.title}". What would you like to know?`,
          timestamp: new Date()
        }
      ]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getUserId = () => user?.id || `device-${localStorage.getItem('deviceId') || Math.random().toString(36).substring(7)}`;

  const handleSend = async () => {
    if (!input.trim() || !selectedArticle) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const questionText = input;
    setInput('');
    setLoading(true);

    try {
      const answer = await newsApi.askAI(selectedArticle.id, questionText, getUserId());

      const aiResponse: Message = {
        role: 'assistant',
        content: decodeHTMLEntities(answer || 'I apologize, but I could not generate an answer at this time. Please try again.'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: error.message.includes('Rate limit')
          ? 'You\'ve reached the maximum number of questions per hour. Please try again later.'
          : 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };


  if (!showAIChat || !selectedArticle) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Sparkles className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">AI Assistant</h3>
            <p className="text-xs text-slate-600">Ask about this article</p>
          </div>
        </div>
        <button
          onClick={() => setShowAIChat(false)}
          className="p-2 hover:bg-slate-100 rounded-lg transition active:scale-95"
        >
          <X size={24} className="text-slate-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
          <h4 className="font-semibold text-slate-900 mb-1 text-sm">{selectedArticle.title}</h4>
          <p className="text-xs text-slate-600 leading-relaxed">{selectedArticle.summary}</p>
        </div>

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-nuuz-yellow text-white shadow-sm'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-3 rounded-2xl flex items-center gap-2">
              <Loader className="animate-spin text-slate-600" size={16} />
              <span className="text-slate-600 text-sm">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 bg-white safe-area-inset-bottom">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-3 bg-nuuz-yellow hover:bg-yellow-500 active:bg-yellow-600 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Powered by AI • Limited to 10 questions per hour
        </p>
      </div>
    </div>
  );
};
