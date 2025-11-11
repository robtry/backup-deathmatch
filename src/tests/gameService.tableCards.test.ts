import { describe, it, expect } from 'vitest';
import {
  initializeTableCards,
  refreshTableCards,
  canGameContinue,
  getRemainingCardsCount
} from '@/services/gameService';
import { createMockDeck } from './testUtils';

describe('gameService - Table Cards Management', () => {
  describe('initializeTableCards', () => {
    it('should return first 3 cards from the deck', () => {
      const deck = createMockDeck(5, 5, 5); // 15 cards total

      const tableCards = initializeTableCards(deck);

      expect(tableCards).toHaveLength(3);
      expect(tableCards[0]).toEqual(deck[0]);
      expect(tableCards[1]).toEqual(deck[1]);
      expect(tableCards[2]).toEqual(deck[2]);
    });

    it('should throw error if deck has less than 3 cards', () => {
      const smallDeck = createMockDeck(1, 1, 0); // Only 2 cards

      expect(() => initializeTableCards(smallDeck)).toThrow(
        'El mazo debe tener al menos 3 cartas para inicializar el tablero.'
      );
    });

    it('should work with exactly 3 cards', () => {
      const deck = createMockDeck(1, 1, 1); // Exactly 3 cards

      const tableCards = initializeTableCards(deck);

      expect(tableCards).toHaveLength(3);
    });
  });

  describe('refreshTableCards', () => {
    it('should replace selected card with next card from deck', () => {
      const deck = createMockDeck(5, 5, 5); // 15 cards
      const tableCards = deck.slice(0, 3);
      const cardsDrawn = 3;
      const selectedCardIndex = 1;

      const result = refreshTableCards(tableCards, selectedCardIndex, deck, cardsDrawn);

      // Should have 3 cards still
      expect(result.tableCards).toHaveLength(3);
      // Card at index 1 should be replaced with card at index 3 (cardsDrawn)
      expect(result.tableCards[selectedCardIndex]).toEqual(deck[3]);
      // Other cards should remain
      expect(result.tableCards[0]).toEqual(deck[0]);
      expect(result.tableCards[2]).toEqual(deck[2]);
      // Cards drawn should increment
      expect(result.newCardsDrawn).toBe(4);
    });

    it('should remove card when no more cards available in deck', () => {
      const deck = createMockDeck(5, 5, 5); // 15 cards
      const tableCards = deck.slice(12, 15); // Last 3 cards
      const cardsDrawn = 15; // All cards drawn
      const selectedCardIndex = 1;

      const result = refreshTableCards(tableCards, selectedCardIndex, deck, cardsDrawn);

      // Should have only 2 cards now
      expect(result.tableCards).toHaveLength(2);
      // Card at selected index should be removed
      expect(result.tableCards[0]).toEqual(tableCards[0]);
      expect(result.tableCards[1]).toEqual(tableCards[2]);
      // Cards drawn should stay the same
      expect(result.newCardsDrawn).toBe(15);
    });

    it('should throw error for invalid card index', () => {
      const deck = createMockDeck(5, 5, 5);
      const tableCards = deck.slice(0, 3);
      const cardsDrawn = 3;

      expect(() => refreshTableCards(tableCards, -1, deck, cardsDrawn)).toThrow(
        'Índice de carta inválido.'
      );

      expect(() => refreshTableCards(tableCards, 3, deck, cardsDrawn)).toThrow(
        'Índice de carta inválido.'
      );

      expect(() => refreshTableCards(tableCards, 10, deck, cardsDrawn)).toThrow(
        'Índice de carta inválido.'
      );
    });

    it('should handle replacing first card (index 0)', () => {
      const deck = createMockDeck(5, 5, 5);
      const tableCards = deck.slice(0, 3);
      const cardsDrawn = 3;

      const result = refreshTableCards(tableCards, 0, deck, cardsDrawn);

      expect(result.tableCards[0]).toEqual(deck[3]);
      expect(result.tableCards[1]).toEqual(deck[1]);
      expect(result.tableCards[2]).toEqual(deck[2]);
    });

    it('should handle replacing last card (index 2)', () => {
      const deck = createMockDeck(5, 5, 5);
      const tableCards = deck.slice(0, 3);
      const cardsDrawn = 3;

      const result = refreshTableCards(tableCards, 2, deck, cardsDrawn);

      expect(result.tableCards[0]).toEqual(deck[0]);
      expect(result.tableCards[1]).toEqual(deck[1]);
      expect(result.tableCards[2]).toEqual(deck[3]);
    });
  });

  describe('canGameContinue', () => {
    it('should return true when cards are on table', () => {
      const deck = createMockDeck(5, 5, 5);
      const tableCards = deck.slice(0, 3);
      const cardsDrawn = 3;

      const result = canGameContinue(tableCards, deck, cardsDrawn);

      expect(result).toBe(true);
    });

    it('should return true when cards are still in deck', () => {
      const deck = createMockDeck(5, 5, 5);
      const tableCards = deck.slice(0, 3);
      const cardsDrawn = 10; // 5 cards still available

      const result = canGameContinue(tableCards, deck, cardsDrawn);

      expect(result).toBe(true);
    });

    it('should return false when no cards on table and deck is empty', () => {
      const deck = createMockDeck(5, 5, 5);
      const tableCards: typeof deck = [];
      const cardsDrawn = 15; // All cards drawn

      const result = canGameContinue(tableCards, deck, cardsDrawn);

      expect(result).toBe(false);
    });

    it('should return true when last card is on table', () => {
      const deck = createMockDeck(5, 5, 5);
      const tableCards = [deck[14]]; // Last card
      const cardsDrawn = 15;

      const result = canGameContinue(tableCards, deck, cardsDrawn);

      expect(result).toBe(true);
    });
  });

  describe('getRemainingCardsCount', () => {
    it('should return total cards on table and in deck', () => {
      const deck = createMockDeck(5, 5, 5); // 15 total
      const tableCards = deck.slice(0, 3); // 3 on table
      const cardsDrawn = 3; // 12 remaining in deck

      const result = getRemainingCardsCount(tableCards, deck, cardsDrawn);

      expect(result).toBe(15); // 3 + 12
    });

    it('should return correct count when deck is partially drawn', () => {
      const deck = createMockDeck(5, 5, 5); // 15 total
      const tableCards = deck.slice(0, 3); // 3 on table
      const cardsDrawn = 10; // 5 remaining in deck

      const result = getRemainingCardsCount(tableCards, deck, cardsDrawn);

      expect(result).toBe(8); // 3 + 5
    });

    it('should return 0 when no cards remain', () => {
      const deck = createMockDeck(5, 5, 5);
      const tableCards: typeof deck = [];
      const cardsDrawn = 15;

      const result = getRemainingCardsCount(tableCards, deck, cardsDrawn);

      expect(result).toBe(0);
    });

    it('should return only table cards count when deck is fully drawn', () => {
      const deck = createMockDeck(5, 5, 5);
      const tableCards = deck.slice(12, 15); // Last 3 cards on table
      const cardsDrawn = 15;

      const result = getRemainingCardsCount(tableCards, deck, cardsDrawn);

      expect(result).toBe(3);
    });
  });
});
