import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { gameService, GameSession } from '@/services/games';

interface GameModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  currentPlayerId: string;
  opponentId: string;
  opponentName: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GameModal({
  visible,
  onClose,
  conversationId,
  currentPlayerId,
  opponentId,
  opponentName,
}: GameModalProps) {
  const [selectedGameType, setSelectedGameType] = useState<GameSession['type'] | null>(null);
  const [currentGame, setCurrentGame] = useState<GameSession | null>(null);
  const [gameHistory, setGameHistory] = useState<GameSession[]>([]);

  useEffect(() => {
    if (visible) {
      loadGameHistory();
    }
  }, [visible]);

  const loadGameHistory = async () => {
    const history = await gameService.getGamesHistory();
    const playerGames = history.filter(game => 
      game.players.includes(currentPlayerId) && game.players.includes(opponentId)
    );
    setGameHistory(playerGames.slice(0, 10)); // Últimos 10 jogos
  };

  const startNewGame = async (gameType: GameSession['type']) => {
    const game = await gameService.createGame(gameType, currentPlayerId, opponentId);
    setCurrentGame(game);
    setSelectedGameType(gameType);
  };

  const makeMove = async (move: any) => {
    if (!currentGame) return;
    
    const updatedGame = await gameService.makeMove(currentGame.id, currentPlayerId, move);
    if (updatedGame) {
      setCurrentGame(updatedGame);
      if (updatedGame.status === 'finished') {
        loadGameHistory();
      }
    }
  };

  const renderGameSelection = () => (
    <View style={styles.gameSelection}>
      <Text style={styles.sectionTitle}>Escolha um Jogo</Text>
      <View style={styles.gameGrid}>
        <TouchableOpacity 
          style={styles.gameCard}
          onPress={() => startNewGame('tic-tac-toe')}
        >
          <MaterialIcons name="grid-on" size={32} color={Colors.primary} />
          <Text style={styles.gameCardTitle}>Jogo da Velha</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gameCard}
          onPress={() => startNewGame('quiz')}
        >
          <MaterialIcons name="quiz" size={32} color={Colors.success} />
          <Text style={styles.gameCardTitle}>Quiz</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gameCard}
          onPress={() => startNewGame('word-game')}
        >
          <MaterialIcons name="abc" size={32} color={Colors.warning} />
          <Text style={styles.gameCardTitle}>Palavra</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gameCard}
          onPress={() => startNewGame('memory')}
        >
          <MaterialIcons name="memory" size={32} color={Colors.error} />
          <Text style={styles.gameCardTitle}>Memória</Text>
        </TouchableOpacity>
      </View>

      {gameHistory.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Jogos Recentes com {opponentName}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {gameHistory.map((game) => (
              <View key={game.id} style={styles.historyCard}>
                <Text style={styles.historyGameType}>
                  {game.type === 'tic-tac-toe' ? '🎯' :
                   game.type === 'quiz' ? '🧠' :
                   game.type === 'word-game' ? '📝' : '🧩'}
                </Text>
                <Text style={styles.historyResult}>
                  {game.winner === currentPlayerId ? 'Vitória' :
                   game.winner === opponentId ? 'Derrota' :
                   game.winner ? 'Empate' : 'Incompleto'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderTicTacToe = () => {
    if (!currentGame) return null;
    
    const { board, currentPlayer } = currentGame.gameState;
    const isMyTurn = currentGame.players[currentPlayer] === currentPlayerId;

    return (
      <View style={styles.gameArea}>
        <View style={styles.gameHeader}>
          <Text style={styles.gameTitle}>Jogo da Velha</Text>
          <Text style={styles.turnIndicator}>
            {isMyTurn ? 'Sua vez!' : `Vez de ${opponentName}`}
          </Text>
        </View>

        <View style={styles.ticTacToeBoard}>
          {board.map((cell: string | null, index: number) => (
            <TouchableOpacity
              key={index}
              style={styles.ticTacToeCell}
              onPress={() => isMyTurn && !cell ? makeMove(index) : null}
              disabled={!isMyTurn || !!cell}
            >
              <Text style={styles.ticTacToeCellText}>{cell || ''}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {currentGame.status === 'finished' && (
          <View style={styles.gameResult}>
            <Text style={styles.gameResultText}>
              {currentGame.winner === currentPlayerId ? '🎉 Você ganhou!' :
               currentGame.winner === opponentId ? '😔 Você perdeu!' :
               '🤝 Empate!'}
            </Text>
            <TouchableOpacity 
              style={styles.playAgainButton}
              onPress={() => startNewGame('tic-tac-toe')}
            >
              <Text style={styles.playAgainText}>Jogar Novamente</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderQuiz = () => {
    if (!currentGame) return null;
    
    const { questions, currentQuestion, scores } = currentGame.gameState;
    const question = questions[currentQuestion];

    if (!question) {
      return (
        <View style={styles.gameArea}>
          <Text style={styles.gameTitle}>Quiz Finalizado!</Text>
          <View style={styles.quizScores}>
            <Text style={styles.scoreText}>Sua pontuação: {scores.player1}</Text>
            <Text style={styles.scoreText}>{opponentName}: {scores.player2}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.gameArea}>
        <View style={styles.gameHeader}>
          <Text style={styles.gameTitle}>Quiz - Pergunta {currentQuestion + 1}</Text>
          <View style={styles.quizScores}>
            <Text style={styles.scoreText}>Você: {scores.player1}</Text>
            <Text style={styles.scoreText}>{opponentName}: {scores.player2}</Text>
          </View>
        </View>

        <View style={styles.quizQuestion}>
          <Text style={styles.questionText}>{question.question}</Text>
          <View style={styles.quizOptions}>
            {question.options.map((option: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.quizOption}
                onPress={() => makeMove(index)}
              >
                <Text style={styles.quizOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderWordGame = () => {
    if (!currentGame) return null;
    
    const { word, guessedLetters, remainingGuesses } = currentGame.gameState;
    
    const displayWord = word
      .split('')
      .map(letter => guessedLetters.includes(letter.toLowerCase()) ? letter : '_')
      .join(' ');

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    return (
      <View style={styles.gameArea}>
        <View style={styles.gameHeader}>
          <Text style={styles.gameTitle}>Jogo da Palavra</Text>
          <Text style={styles.remainingGuesses}>
            Tentativas restantes: {remainingGuesses}
          </Text>
        </View>

        <View style={styles.wordDisplay}>
          <Text style={styles.wordText}>{displayWord}</Text>
        </View>

        <View style={styles.alphabet}>
          {alphabet.map(letter => (
            <TouchableOpacity
              key={letter}
              style={[
                styles.letterButton,
                guessedLetters.includes(letter.toLowerCase()) && styles.letterButtonUsed
              ]}
              onPress={() => makeMove(letter.toLowerCase())}
              disabled={guessedLetters.includes(letter.toLowerCase())}
            >
              <Text style={styles.letterButtonText}>{letter}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderCurrentGame = () => {
    if (!currentGame) return null;

    switch (currentGame.type) {
      case 'tic-tac-toe':
        return renderTicTacToe();
      case 'quiz':
        return renderQuiz();
      case 'word-game':
        return renderWordGame();
      default:
        return <Text style={styles.comingSoon}>Em breve!</Text>;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentGame ? 'Jogando' : 'Jogos'} com {opponentName}
          </Text>
          {currentGame && (
            <TouchableOpacity 
              onPress={() => {
                setCurrentGame(null);
                setSelectedGameType(null);
              }}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {currentGame ? renderCurrentGame() : renderGameSelection()}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  gameSelection: {
    padding: 20,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 30,
  },
  gameCard: {
    backgroundColor: Colors.surface,
    width: (SCREEN_WIDTH - 60) / 2,
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  gameCardTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  historySection: {
    marginTop: 20,
  },
  historyCard: {
    backgroundColor: Colors.surface,
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  historyGameType: {
    fontSize: 24,
    marginBottom: 4,
  },
  historyResult: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  gameArea: {
    padding: 20,
  },
  gameHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gameTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  turnIndicator: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  ticTacToeBoard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 20,
  },
  ticTacToeCell: {
    width: 80,
    height: 80,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  ticTacToeCellText: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  gameResult: {
    alignItems: 'center',
    padding: 20,
  },
  gameResultText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  playAgainButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  playAgainText: {
    color: Colors.text,
    fontWeight: '600',
  },
  quizScores: {
    flexDirection: 'row',
    gap: 20,
  },
  scoreText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  quizQuestion: {
    alignItems: 'center',
  },
  questionText: {
    color: Colors.text,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  quizOptions: {
    width: '100%',
    gap: 12,
  },
  quizOption: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quizOptionText: {
    color: Colors.text,
    fontSize: 16,
  },
  remainingGuesses: {
    color: Colors.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  wordDisplay: {
    alignItems: 'center',
    marginBottom: 30,
  },
  wordText: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  alphabet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  letterButton: {
    backgroundColor: Colors.surface,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterButtonUsed: {
    backgroundColor: Colors.textMuted,
    opacity: 0.5,
  },
  letterButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  comingSoon: {
    color: Colors.textMuted,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
});