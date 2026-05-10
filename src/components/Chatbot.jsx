import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import './Chatbot.css'

const API_URL      = import.meta.env.VITE_API_URL      || 'http://localhost:8000/ask'
const FILE_ID      = import.meta.env.VITE_FILE_ID      || ''
const BUSINESS_ID  = import.meta.env.VITE_BUSINESS_ID  || ''

const SUGGESTIONS = [
  'What is the breakdown of emotions across comments?',
  'Show me top performing Facebook Ad comments',
  'What are customers saying on Instagram?',
]

/* ── Icons ─────────────────────────────────────────────────────────── */

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function BotAvatar() {
  return <div className="msg-avatar bot">X</div>
}

function UserAvatar() {
  return (
    <div className="msg-avatar user">
      <UserIcon />
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="message bot">
      <BotAvatar />
      <div className="msg-content">
        <div className="msg-bubble">
          <div className="typing-bubble">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`message ${isUser ? 'user' : 'bot'}`}>
      {!isUser && <BotAvatar />}
      <div className="msg-content">
        <div className="msg-bubble">
          {isUser
            ? message.content
            : <ReactMarkdown>{message.content}</ReactMarkdown>
          }
        </div>
      </div>
      {isUser && <UserAvatar />}
    </div>
  )
}

function WelcomeScreen({ onSuggestion }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-logo">X</div>
      <div className="welcome-title">How can I help you?</div>
      <div className="welcome-subtitle">
        Ask me anything about your data — emotions, comments, trends, and more.
      </div>
      <div className="suggestion-chips">
        {SUGGESTIONS.map(s => (
          <button key={s} className="suggestion-chip" onClick={() => onSuggestion(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────── */

export default function Chatbot() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [input])

  const sendMessage = useCallback(async (overrideText) => {
    const text = (overrideText ?? input).trim()
    if (!text || isLoading) return

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id:     FILE_ID,
          business_id: BUSINESS_ID,
          question:    text,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const reply = data.answer ?? 'Sorry, I could not understand that.'

      setMessages(prev => [...prev, { role: 'bot', content: reply }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'bot', content: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
      setTimeout(() => textareaRef.current?.focus(), 0)
    }
  }, [input, isLoading])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const canSend = input.trim().length > 0 && !isLoading

  return (
    <div className="chatbot-page">

      {/* Header */}
      <header className="chatbot-header">
        <div className="header-brand">
          <div className="header-logo">X</div>
          <div className="header-titles">
            <span className="header-name">Xploro</span>
            <span className="header-subtitle">AI Assistant</span>
          </div>
        </div>
        <div className="header-status">
          <span className="status-dot" />
          <span className="status-text">Online</span>
        </div>
      </header>

      {/* Messages */}
      <main className="chatbot-messages">
        <div className="messages-inner">
          {messages.length === 0 && !isLoading && (
            <WelcomeScreen onSuggestion={sendMessage} />
          )}
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="chatbot-footer">
        <div className="input-wrapper">
          <div className="input-row">
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything…"
              rows={1}
            />
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={!canSend}
              aria-label="Send"
            >
              <SendIcon />
            </button>
          </div>
          <p className="input-hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </footer>

    </div>
  )
}
