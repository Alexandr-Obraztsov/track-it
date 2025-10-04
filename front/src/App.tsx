import { Provider } from 'react-redux'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { store } from './store'
import { MyTasksPage } from './pages/MyTasksPage'
import { ChatsListPage } from './pages/ChatsListPage'
import { ChatDetailPage } from './pages/ChatDetailPage'

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MyTasksPage />} />
          <Route path="/chats" element={<ChatsListPage />} />
          <Route path="/chats/:chatId" element={<ChatDetailPage />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App
