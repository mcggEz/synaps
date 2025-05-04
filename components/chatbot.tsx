import React from 'react'

const Chatbot = () => {
  return (
    <aside className="w-80  border-l p-4 flex flex-col justify-between">
    <div>
      <h2 className="text-lg font-semibold mb-2">Synaps Assistant</h2>
      <div className=" p-2 rounded h-[400px] overflow-y-auto text-sm">
        <p><strong>Bot:</strong> Hi! How can I help you today?</p>
        {/* Add more messages here */}
      </div>
    </div>
    <div className="mt-4">
      <input
        type="text"
        placeholder="Type your message..."
        className="w-full p-2 border rounded"
      />
      <button className="mt-2 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
        Send
      </button>
    </div>
  </aside>
  )
}

export default Chatbot
