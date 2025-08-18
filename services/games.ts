import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GameSession {
  id: string;
  type: 'tic-tac-toe' | 'quiz' | 'word-game' | 'memory';
  players: string[];
  gameState: any;
  status: 'waiting' | 'active' | 'finished';
  winner?: string;
  createdAt: string;
  finishedAt?: string;
}

export interface GameMove {
  gameId: string;
  playerId: string;
  move: any;
  timestamp: string;
}

class GameService {
  private static readonly GAMES_KEY = 'anvic_games_history';

  // Criar novo jogo
  async createGame(
    type: GameSession['type'],
    playerId: string,
    opponentId: string
  ): Promise<GameSession> {
    const gameSession: GameSession = {
      id: `game_${Date.now()}_${Math.random()}`,
      type,
      players: [playerId, opponentId],
      gameState: this.initializeGameState(type),
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };

    await this.saveGame(gameSession);
    return gameSession;
  }

  // Inicializar estado do jogo
  private initializeGameState(type: GameSession['type']): any {
    switch (type) {
      case 'tic-tac-toe':
        return {
          board: Array(9).fill(null),
          currentPlayer: 0,
          moves: 0,
        };
      
      case 'quiz':
        return {
          questions: this.generateQuizQuestions(),
          currentQuestion: 0,
          scores: { player1: 0, player2: 0 },
          answers: [],
        };
      
      case 'word-game':
        return {
          word: this.generateRandomWord(),
          guesses: [],
          remainingGuesses: 6,
          guessedLetters: [],
        };
      
      case 'memory':
        return {
          cards: this.generateMemoryCards(),
          flippedCards: [],
          matchedPairs: [],
          currentPlayer: 0,
          scores: { player1: 0, player2: 0 },
        };
      
      default:
        return {};
    }
  }

  // Fazer jogada
  async makeMove(gameId: string, playerId: string, move: any): Promise<GameSession | null> {
    try {
      const game = await this.getGame(gameId);
      if (!game || game.status !== 'active') return null;

      const updatedGame = this.processMove(game, playerId, move);
      await this.saveGame(updatedGame);

      return updatedGame;
    } catch (error) {
      console.error('Erro ao fazer jogada:', error);
      return null;
    }
  }

  // Processar jogada baseada no tipo de jogo
  private processMove(game: GameSession, playerId: string, move: any): GameSession {
    switch (game.type) {
      case 'tic-tac-toe':
        return this.processTicTacToeMove(game, playerId, move);
      
      case 'quiz':
        return this.processQuizMove(game, playerId, move);
      
      case 'word-game':
        return this.processWordGameMove(game, playerId, move);
      
      case 'memory':
        return this.processMemoryMove(game, playerId, move);
      
      default:
        return game;
    }
  }

  // Processar jogo da velha
  private processTicTacToeMove(game: GameSession, playerId: string, position: number): GameSession {
    const { board, currentPlayer, moves } = game.gameState;
    const playerIndex = game.players.indexOf(playerId);
    
    if (playerIndex !== currentPlayer || board[position] !== null) {
      return game;
    }

    const newBoard = [...board];
    newBoard[position] = playerIndex === 0 ? 'X' : 'O';
    
    const winner = this.checkTicTacToeWinner(newBoard);
    const newMoves = moves + 1;

    return {
      ...game,
      gameState: {
        board: newBoard,
        currentPlayer: (currentPlayer + 1) % 2,
        moves: newMoves,
      },
      status: winner || newMoves === 9 ? 'finished' : 'active',
      winner: winner ? game.players[winner === 'X' ? 0 : 1] : undefined,
      finishedAt: winner || newMoves === 9 ? new Date().toISOString() : undefined,
    };
  }

  // Verificar vencedor do jogo da velha
  private checkTicTacToeWinner(board: string[]): string | null {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Linhas
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colunas
      [0, 4, 8], [2, 4, 6], // Diagonais
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    return null;
  }

  // Processar quiz
  private processQuizMove(game: GameSession, playerId: string, answer: number): GameSession {
    const { questions, currentQuestion, scores, answers } = game.gameState;
    const playerIndex = game.players.indexOf(playerId);
    
    const isCorrect = answer === questions[currentQuestion].correct;
    const newScores = { ...scores };
    const playerKey = playerIndex === 0 ? 'player1' : 'player2';
    
    if (isCorrect) {
      newScores[playerKey] += 10;
    }

    const newAnswers = [...answers, { playerId, answer, correct: isCorrect }];
    const nextQuestion = currentQuestion + 1;
    const isFinished = nextQuestion >= questions.length;

    let winner;
    if (isFinished) {
      winner = newScores.player1 > newScores.player2 ? game.players[0] :
               newScores.player2 > newScores.player1 ? game.players[1] : null;
    }

    return {
      ...game,
      gameState: {
        questions,
        currentQuestion: nextQuestion,
        scores: newScores,
        answers: newAnswers,
      },
      status: isFinished ? 'finished' : 'active',
      winner,
      finishedAt: isFinished ? new Date().toISOString() : undefined,
    };
  }

  // Processar jogo de palavras
  private processWordGameMove(game: GameSession, playerId: string, letter: string): GameSession {
    const { word, guesses, remainingGuesses, guessedLetters } = game.gameState;
    
    if (guessedLetters.includes(letter)) {
      return game;
    }

    const newGuessedLetters = [...guessedLetters, letter];
    const isCorrect = word.toLowerCase().includes(letter.toLowerCase());
    const newRemainingGuesses = isCorrect ? remainingGuesses : remainingGuesses - 1;
    
    const wordLetters = word.toLowerCase().split('');
    const guessedWordLetters = wordLetters.filter(l => newGuessedLetters.includes(l));
    const isWordComplete = wordLetters.every(l => newGuessedLetters.includes(l));
    
    const isFinished = isWordComplete || newRemainingGuesses === 0;
    const winner = isWordComplete ? playerId : newRemainingGuesses === 0 ? null : undefined;

    return {
      ...game,
      gameState: {
        word,
        guesses: [...guesses, { letter, correct: isCorrect }],
        remainingGuesses: newRemainingGuesses,
        guessedLetters: newGuessedLetters,
      },
      status: isFinished ? 'finished' : 'active',
      winner,
      finishedAt: isFinished ? new Date().toISOString() : undefined,
    };
  }

  // Processar jogo da memória
  private processMemoryMove(game: GameSession, playerId: string, cardIndex: number): GameSession {
    const { cards, flippedCards, matchedPairs, currentPlayer, scores } = game.gameState;
    const playerIndex = game.players.indexOf(playerId);
    
    if (playerIndex !== currentPlayer || flippedCards.includes(cardIndex) || matchedPairs.includes(cardIndex)) {
      return game;
    }

    const newFlippedCards = [...flippedCards, cardIndex];
    let newMatchedPairs = [...matchedPairs];
    let newScores = { ...scores };
    let newCurrentPlayer = currentPlayer;

    if (newFlippedCards.length === 2) {
      const [card1, card2] = newFlippedCards;
      if (cards[card1] === cards[card2]) {
        // Par encontrado
        newMatchedPairs.push(card1, card2);
        const playerKey = playerIndex === 0 ? 'player1' : 'player2';
        newScores[playerKey] += 10;
      } else {
        // Não é par, trocar jogador
        newCurrentPlayer = (currentPlayer + 1) % 2;
      }
      newFlippedCards = [];
    }

    const isFinished = newMatchedPairs.length === cards.length;
    let winner;
    if (isFinished) {
      winner = newScores.player1 > newScores.player2 ? game.players[0] :
               newScores.player2 > newScores.player1 ? game.players[1] : null;
    }

    return {
      ...game,
      gameState: {
        cards,
        flippedCards: newFlippedCards,
        matchedPairs: newMatchedPairs,
        currentPlayer: newCurrentPlayer,
        scores: newScores,
      },
      status: isFinished ? 'finished' : 'active',
      winner,
      finishedAt: isFinished ? new Date().toISOString() : undefined,
    };
  }

  // Gerar perguntas do quiz
  private generateQuizQuestions(): any[] {
    return [
      {
        question: "Qual é a capital do Brasil?",
        options: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
        correct: 2
      },
      {
        question: "Quantos continentes existem?",
        options: ["5", "6", "7", "8"],
        correct: 2
      },
      {
        question: "Qual é o maior planeta do sistema solar?",
        options: ["Terra", "Marte", "Júpiter", "Saturno"],
        correct: 2
      },
    ];
  }

  // Gerar palavra aleatória
  private generateRandomWord(): string {
    const words = [
      'JAVASCRIPT', 'REACT', 'MOBILE', 'ANVIC', 'GAME', 'CHAT',
      'AMIGO', 'FELIZ', 'SONHO', 'MUNDO', 'AMOR', 'VIDA'
    ];
    return words[Math.floor(Math.random() * words.length)];
  }

  // Gerar cartas da memória
  private generateMemoryCards(): string[] {
    const symbols = ['🍎', '🍌', '🍇', '🍊', '🍓', '🥝', '🍑', '🥭'];
    const cards = [...symbols, ...symbols];
    return cards.sort(() => Math.random() - 0.5);
  }

  // Obter jogo
  async getGame(gameId: string): Promise<GameSession | null> {
    try {
      const games = await this.getGamesHistory();
      return games.find(game => game.id === gameId) || null;
    } catch (error) {
      console.error('Erro ao obter jogo:', error);
      return null;
    }
  }

  // Salvar jogo
  private async saveGame(game: GameSession): Promise<void> {
    try {
      const games = await this.getGamesHistory();
      const existingIndex = games.findIndex(g => g.id === game.id);
      
      if (existingIndex >= 0) {
        games[existingIndex] = game;
      } else {
        games.unshift(game);
      }

      // Manter apenas últimos 100 jogos
      const limitedGames = games.slice(0, 100);
      await AsyncStorage.setItem(GameService.GAMES_KEY, JSON.stringify(limitedGames));
    } catch (error) {
      console.error('Erro ao salvar jogo:', error);
    }
  }

  // Obter histórico de jogos
  async getGamesHistory(): Promise<GameSession[]> {
    try {
      const data = await AsyncStorage.getItem(GameService.GAMES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      return [];
    }
  }

  // Obter jogos ativos
  async getActiveGames(playerId: string): Promise<GameSession[]> {
    const games = await this.getGamesHistory();
    return games.filter(game => 
      game.players.includes(playerId) && 
      (game.status === 'active' || game.status === 'waiting')
    );
  }
}

export const gameService = new GameService();