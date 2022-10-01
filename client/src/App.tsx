import './assets/css/App.css';
import { socket, SocketContext } from './context/socket';
import { World } from './components/World';

function App() {
  return (
    <SocketContext.Provider value={socket} >
      <World />
    </SocketContext.Provider>
  );
}

export { App };
