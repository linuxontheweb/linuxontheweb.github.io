const log=(...args)=>{console.log(...args)};

class GameNode {/*«*/
  constructor(infoset, actions) {
    this.infoset = infoset;
    this.actions = actions;
    this.regretSum = new Array(actions.length).fill(0);
    this.strategySum = new Array(actions.length).fill(0);
    this.strategy = new Array(actions.length).fill(1 / actions.length);
    this.children = new Map();
  }

  getAverageStrategy() {
    const sum = this.strategySum.reduce((a, b) => a + b, 0);
    return this.strategySum.map(v => (sum > 0 ? v / sum : 1 / this.actions.length));
  }
}/*»*/

class KuhnPokerBlueprint {

  constructor() {/*«*/
    this.nodes = new Map();
    this.cards = [1, 2, 3];
    this.actions = ["check", "bet1", "bet2", "fold"];
    this.communityCards = [1, 2, 3];
  }/*»*/
  getNode(infoset, actions) {/*«*/
    if (!this.nodes.has(infoset)) {
      this.nodes.set(infoset, new GameNode(infoset, actions));
    }
    return this.nodes.get(infoset);
  }/*»*/
  buildTree(player, playerCard, communityCard, history, pot, round) {/*«*/
  // Iterative tree building with fixed logic and iteration limit
    const stack = [{ player, playerCard, communityCard, history, pot, round, parentInfoset: null, action: null }];
    const createdNodes = new Set();
  let nodeCount = 0;
  const maxNodes = 10000; // Limit to ~100 nodes for study

//  while (stack.length > 0 && nodeCount < maxNodes) {
    while (stack.length > 0) {
      const { player, playerCard, communityCard, history, pot, round, parentInfoset, action } = stack.pop();
      const infoset = `P${player}:${playerCard}:R${round}:${communityCard || ""}:${history.join(",")}`;
      // Terminal if fold or check/check in Round 2
      const isTerminal = history.includes("fold") || (round === 2 && history.slice(-2).every(a => a === "check"));
      if (isTerminal) {
        if (parentInfoset && action) {
          this.nodes.get(parentInfoset).children.set(action, infoset);
        }
        continue;
      }

      // Prevent infinite loops by capping history length
      if (history.length > 4) {
//log(history);
		continue;
	  }
      if (createdNodes.has(infoset)) continue;
      createdNodes.add(infoset);
      nodeCount++;
      if (nodeCount >= maxNodes) {
log(`ERROR: nodeCount == ${nodeCount}`);
		break;
	}
      const validActions = history.length > 0 && history[history.length - 1].startsWith("bet")
        ? ["check", "bet1", "bet2", "fold"]
        : ["check", "bet1", "bet2"];
      const node = this.getNode(infoset, validActions);

      for (const action of validActions) {
        const newHistory = [...history, action];
        let newCommunityCard = communityCard;
        let newRound = round;
        let newPot = pot;

        if (action === "fold") {/*«*/
          node.children.set(action, `TERMINAL:${infoset}:${action}`);
        } /*»*/
		else if (action.startsWith("bet")) {/*«*/
          const betSize = action === "bet1" ? 1 : 2;
          newPot += betSize;
          stack.push({
            player: 3 - player,
            playerCard,
            communityCard: newCommunityCard,
            history: newHistory,
            pot: newPot,
            round: newRound,
            parentInfoset: infoset,
            action
          });
        } /*»*/
		else if (action === "check" && history.length > 0 && history[history.length - 1] === "check" && round === 1) {//«
          newCommunityCard = this.communityCards[0];
          newRound = 2;
          stack.push({
            player: 1, // Restart with P1 in Round 2
            playerCard,
            communityCard: newCommunityCard,
            history: newHistory,
            pot: newPot,
            round: newRound,
            parentInfoset: infoset,
            action
          });
        } /*»*/
		else {/*«*/
          stack.push({
            player: 3 - player,
            playerCard,
            communityCard: newCommunityCard,
            history: newHistory,
            pot: newPot,
            round: newRound,
            parentInfoset: infoset,
            action
          });
        }/*»*/

      }

    }

    return `P${player}:${playerCard}:R${round}:${communityCard || ""}:${history.join(",")}`;
  }/*»*/
  cfr(cards, communityCard, history, reachProbs, round, iteration) {/*«*/
    if (history.includes("fold") || (round === 2 && history.slice(-2).every(a => a === "check"))) {
      return this.evaluateTerminal(cards, communityCard, history, round);
    }

    const player = history.length % 2 + 1;
    const infoset = `P${player}:${cards[player - 1]}:R${round}:${communityCard || ""}:${history.join(",")}`;
    const validActions = history.length > 0 && history[history.length - 1].startsWith("bet")
      ? ["check", "bet1", "bet2", "fold"]
      : ["check", "bet1", "bet2"];
    const node = this.getNode(infoset, validActions);

    const strategy = node.getAverageStrategy();
    const utils = new Array(validActions.length).fill(0);
    let nodeUtil = 0;

    for (let i = 0; i < validActions.length; i++) {
      const action = validActions[i];
      const newHistory = [...history, action];
      const newReachProbs = [...reachProbs];
      newReachProbs[player - 1] *= strategy[i];
      let nextCommunityCard = communityCard;
      let nextRound = round;
      if (action === "check" && history.length > 0 && history[history.length - 1] === "check" && round === 1) {
        nextCommunityCard = this.communityCards[0];
        nextRound = 2;
      }
      utils[i] = -this.cfr(cards, nextCommunityCard, newHistory, newReachProbs, nextRound, iteration);
      nodeUtil += strategy[i] * utils[i];
    }

    for (let i = i; i < validActions.length; i++) {
      node.regretSum[i] += reachProbs[3 - player] * (utils[i] - nodeUtil);
      node.strategySum[i] += reachProbs[player - 1] * strategy[i];
    }

    return nodeUtil;
  }/*»*/
  evaluateTerminal(cards, communityCard, history, round) {/*«*/
    if (history.includes("fold")) {
      return history[history.length - 2].startsWith("bet") ? 1 : -1;
    }
    const pot = history.reduce((sum, a) => sum + (a === "bet1" ? 1 : a === "bet2" ? 2 : 0), 2);
    const p1Score = cards[0] + (communityCard || 0);
    const p2Score = cards[1] + (communityCard || 0);
    if (p1Score > p2Score) return pot / 2;
    if (p2Score > p1Score) return -pot / 2;
    return 0;
  }/*»*/
  train(iterations) {/*«*/
    for (let i = 0; i < iterations; i++) {
      for (const card1 of this.cards) {
        for (const card2 of this.cards.filter(c => c !== card1)) {
          this.cfr([card1, card2], null, [], [1, 1], 1, i);
        }
      }
    }
  }/*»*/
  getStrategy(player, card, history, round, communityCard) {/*«*/
    const infoset = `P${player}:${card}:R${round}:${communityCard || ""}:${history.join(",")}`;
    const node = this.nodes.get(infoset);
    if (!node) return null;
    const strategy = node.getAverageStrategy();
    return node.actions.reduce((obj, action, i) => {
      obj[action] = strategy[i];
      return obj;
    }, {});
  }/*»*/

}

export const app=class{
// Example usage
onappinit(){
const game = new KuhnPokerBlueprint();
game.buildTree(1, 1, null, [], 2, 1);
//game.train(10000);
log(game);
}
/*
console.log(game.getStrategy(1, 1, [], 1, null));
console.log(game.getStrategy(2, 2, ["bet1"], 1, null));
console.log(game.getStrategy(1, 1, ["check", "check"], 2, 1));
*/
}
