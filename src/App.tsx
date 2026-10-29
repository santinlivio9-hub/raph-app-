import { MotionConfig } from 'framer-motion';
import { useEffect } from 'react';
import { CreditsScreen } from './screens/CreditsScreen';
import { GameScreen } from './screens/GameScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ResultScreen } from './screens/ResultScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SetupScreen } from './screens/SetupScreen';
import { TutorialScreen } from './screens/TutorialScreen';
import { useGame } from './store/game';
import { useSettings } from './store/settings';

export default function App() {
  const screen = useGame((s) => s.screen);
  const game = useGame((s) => s.game);
  const go = useGame((s) => s.go);
  const tutorialSeen = useSettings((s) => s.tutorialSeen);

  // Tutoriel au premier lancement.
  useEffect(() => {
    if (!tutorialSeen && screen === 'home') go('tutorial');
  }, [tutorialSeen, screen, go]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  // Partie perdue (stockage vidé) : retour à l'accueil.
  const needsGame = screen === 'game' || screen === 'result';
  useEffect(() => {
    if (needsGame && !game) go('home');
  }, [needsGame, game, go]);

  return (
    <MotionConfig reducedMotion="user">
      {screen === 'home' && <HomeScreen />}
      {screen === 'setup' && <SetupScreen />}
      {screen === 'game' && game && <GameScreen game={game} />}
      {screen === 'result' && game && <ResultScreen game={game} />}
      {screen === 'history' && <HistoryScreen />}
      {screen === 'settings' && <SettingsScreen />}
      {screen === 'tutorial' && <TutorialScreen />}
      {screen === 'credits' && <CreditsScreen />}
    </MotionConfig>
  );
}
