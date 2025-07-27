import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Mic } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Ask about your wallet or any Base chain address...",
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording functionality
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass border border-white/20 rounded-3xl p-4"
    >
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Attachment Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
          disabled={disabled}
        >
          <Paperclip className="w-5 h-5 text-gray-400" />
        </motion.button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none max-h-32 min-h-[24px]"
            style={{ lineHeight: '1.5' }}
          />
        </div>

        {/* Voice Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleVoiceRecord}
          className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-white/10 hover:bg-white/20'
          }`}
          disabled={disabled}
        >
          <Mic className={`w-5 h-5 ${isRecording ? 'text-white' : 'text-gray-400'}`} />
        </motion.button>

        {/* Send Button */}
        <motion.button
          type="submit"
          whileHover={{ scale: message.trim() ? 1.1 : 1 }}
          whileTap={{ scale: message.trim() ? 0.9 : 1 }}
          disabled={!message.trim() || disabled}
          className={`p-2 rounded-xl transition-all duration-200 flex-shrink-0 ${
            message.trim() && !disabled
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </form>
    </motion.div>
  );
};

export default ChatInput;