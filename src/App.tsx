import { useEffect } from 'react';
import './App.css';
import init, { greet } from '@pkg/gif_editor.js';

function App() {
  useEffect(() => {
    (async () => {
      await init();
      greet();
    })();
  }, []);

  return (
    <div>Hello, World!</div>
  )
}

export default App
