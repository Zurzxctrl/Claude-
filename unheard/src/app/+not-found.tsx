import Home from './index';

/** Unknown paths (an old deep link, or a web host serving the app under its own path) open the game. */
export default function NotFound() {
  return <Home />;
}
