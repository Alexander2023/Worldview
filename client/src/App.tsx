import './App.css';
import { socket, SocketContext } from './context/socket';
import { World } from './World';

function App() {
  return (
    <SocketContext.Provider value={socket} >
      <World />
    </SocketContext.Provider>
  );
}

export { App };
