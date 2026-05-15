import { useEffect, useMemo, useState } from "react";

export default function SwissTournamentManager() {
  const [tournamentName, setTournamentName] = useState("スイスドロー大会");
  const [players, setPlayers] = useState([]);
  const [playerName, setPlayerName] = useState("");
  const [round, setRound] = useState(1);
  const [maxMatches, setMaxMatches] = useState(5);
  const [matches, setMatches] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("swiss-tournament-data");

    if (saved) {
      const parsed = JSON.parse(saved);
      setTournamentName(parsed.tournamentName || "スイスドロー大会");
      setPlayers(parsed.players || []);
      setRound(parsed.round || 1);
      setMaxMatches(parsed.maxMatches || 5);
      setMatches(parsed.matches || []);
      setDarkMode(parsed.darkMode || false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "swiss-tournament-data",
      JSON.stringify({
        tournamentName,
        players,
        round,
        maxMatches,
        matches,
        darkMode,
      })
    );
  }, [tournamentName, players, round, maxMatches, matches, darkMode]);

  const addPlayer = () => {
    if (!playerName.trim()) return;

    const exists = players.some((p) => p.name === playerName);

    if (exists) {
      alert("同じ名前の参加者がいます");
      return;
    }

    const newPlayer = {
      id: Date.now(),
      name: playerName,
      points: 0,
      bye: false,
      opponents: [],
      history: [],
    };

    setPlayers([...players, newPlayer]);
    setPlayerName("");
  };

  const removePlayer = (id) => {
    if (!confirm("参加者を削除しますか？")) return;

    setPlayers(players.filter((p) => p.id !== id));
  };

  const generatePairings = () => {
    const finishedPlayers = players.filter(
  (p) => p.history.length >= maxMatches
);

if (finishedPlayers.length === players.length) {
  alert("全参加者が規定試合数に到達しています");
  return;
}

    if (players.length < 2) {
      alert("最低2人必要です");
      return;
    }

    const matchNumberBase = (round - 1) * Math.floor(players.length / 2);

    const sorted = [...players].sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      return a.name.localeCompare(b.name);
    });

    const tempPlayers = [...sorted];
    const updatedPlayers = [...sorted];
    const newMatches = [];

    if (tempPlayers.length % 2 === 1) {
      const byePlayer = [...tempPlayers]
        .reverse()
        .find((p) => !p.bye);

      if (byePlayer) {
        byePlayer.points += 1;
        byePlayer.bye = true;
        byePlayer.history.push({
          round,
          opponent: "BYE",
          result: "Win",
        });

        const index = tempPlayers.findIndex((p) => p.id === byePlayer.id);
        tempPlayers.splice(index, 1);
      }
    }

    const used = new Set();

    for (let i = 0; i < tempPlayers.length; i++) {
      const player1 = tempPlayers[i];

      if (used.has(player1.id)) continue;

      let opponent = null;

      for (let j = i + 1; j < tempPlayers.length; j++) {
        const player2 = tempPlayers[j];

        if (used.has(player2.id)) continue;

        const alreadyPlayed = player1.opponents.includes(player2.id);

        if (!alreadyPlayed) {
          opponent = player2;
          break;
        }
      }

      if (!opponent) {
        opponent = tempPlayers.find(
          (p) => !used.has(p.id) && p.id !== player1.id
        );
      }

      if (opponent) {
        used.add(player1.id);
        used.add(opponent.id);

        newMatches.push({
          id: `${round}-${player1.id}-${opponent.id}`,
          matchNo: matchNumberBase + newMatches.length + 1,
          player1,
          player2: opponent,
          result: "",
        });
      }
    }

    setPlayers(updatedPlayers);
    setMatches(newMatches);
  };

  const updateResult = (matchId, result) => {
    setMatches(
      matches.map((m) =>
        m.id === matchId ? { ...m, result } : m
      )
    );
  };

  const finalizeRound = () => {
    const updatedPlayers = [...players];

    matches.forEach((match) => {
      if (!match.result) return;

      const p1 = updatedPlayers.find((p) => p.id === match.player1.id);
      const p2 = updatedPlayers.find((p) => p.id === match.player2.id);

      p1.opponents.push(p2.id);
      p2.opponents.push(p1.id);

      if (match.result === "p1") {
        p1.points += 1;

        p1.history.push({
          round,
          opponent: p2.name,
          result: "Win",
        });

        p2.history.push({
          round,
          opponent: p1.name,
          result: "Lose",
        });
      }

      if (match.result === "p2") {
        p2.points += 1;

        p1.history.push({
          round,
          opponent: p2.name,
          result: "Lose",
        });

        p2.history.push({
          round,
          opponent: p1.name,
          result: "Win",
        });
      }

      if (match.result === "draw") {
        p1.points += 0.5;
        p2.points += 0.5;

        p1.history.push({
          round,
          opponent: p2.name,
          result: "Draw",
        });

        p2.history.push({
          round,
          opponent: p1.name,
          result: "Draw",
        });
      }
    });

    setPlayers(updatedPlayers);
    setMatches([]);
    setRound(round + 1);
  };

  const resetTournament = () => {
    if (!confirm("大会データを削除しますか？")) return;

    localStorage.removeItem("swiss-tournament-data");

    setTournamentName("スイスドロー大会");
    setPlayers([]);
    setMatches([]);
    setRound(1);
    setMaxRounds(5);
  };

  const editHistory = (playerId, historyIndex) => {
    const newResult = prompt("結果を入力 (Win / Lose / Draw)");

    if (!newResult) return;

    const updated = [...players];

    const player = updated.find((p) => p.id === playerId);

    player.history[historyIndex].result = newResult;

    setPlayers(updated);
  };
const maxPossibleMatches = Math.floor(players.length / 2);

const maxSwissRounds =
  players.length <= 1
    ? 1
    : players.length % 2 === 0
    ? players.length - 1
    : players.length;
  const sortedRanking = useMemo(() => {
    return [...players].sort((a, b) => b.points - a.points);
  }, [players]);

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        darkMode
          ? "bg-gray-900 text-white"
          : "bg-gray-100 text-black"
      }`}
    >
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div
          className={`rounded-3xl shadow-xl p-6 ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div>
              <input
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                className={`text-3xl font-bold bg-transparent border-b outline-none w-full ${
                  darkMode ? "border-gray-500" : "border-gray-300"
                }`}
              />

              <div className="mt-3 flex flex-wrap gap-4 items-center opacity-70">
                <p>
                  現在ラウンド: {round}
                </p>

                <div className="flex items-center gap-2">
                  <span>1人あたりの試合数</span>

                  <input
                    type="number"
                    min="1"
                    max={maxSwissRounds}
                    value={maxMatches}
                    onChange={(e) => {
  const value = Number(e.target.value);

  if (value > maxSwissRounds) {
    alert(
      `再戦なしで可能な最大試合数は ${maxSwissRounds} 回です`
    );
    setMaxMatches(maxSwissRounds);
    return;
  }

  setMaxMatches(value);
}}
                    className={`w-20 px-2 py-1 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-white border-gray-300"
                    }`}
                  />

                  <p className="text-xs opacity-70 mt-1">
  再戦なし最大: {maxSwissRounds} 回
</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="px-4 py-2 rounded-2xl bg-indigo-600 text-white"
              >
                {darkMode ? "ライトモード" : "ダークモード"}
              </button>

              <button
                onClick={resetTournament}
                className="px-4 py-2 rounded-2xl bg-red-600 text-white"
              >
                大会リセット
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            className={`rounded-3xl shadow-xl p-6 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2 className="text-2xl font-bold mb-4">
              参加者管理
            </h2>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="参加者名"
                className={`flex-1 px-4 py-2 rounded-2xl border ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
              />

              <button
                onClick={addPlayer}
                className="bg-blue-600 text-white px-4 py-2 rounded-2xl"
              >
                追加
              </button>
            </div>

            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`flex justify-between items-center rounded-2xl px-4 py-3 ${
                    darkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <div>
                    <div className="font-semibold">
                      {player.name}
                    </div>
                    <div className="text-sm opacity-70">
                      {player.points} pt
                    </div>
                  </div>

                  <button
                    onClick={() => removePlayer(player.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-xl"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`rounded-3xl shadow-xl p-6 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                ランキング
              </h2>

              {players.every((p) => p.history.length >= maxMatches) ? (
                <div className="text-red-500 font-semibold">
                  ラウンド終了
                </div>
              ) : (
                <button
                  onClick={generatePairings}
                  className="bg-green-600 text-white px-4 py-2 rounded-2xl"
                >
                  組み合わせ生成
                </button>
              )}
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-500">
                  <th className="text-left py-2">順位</th>
                  <th className="text-left py-2">名前</th>
                  <th className="text-left py-2">Pt</th>
                </tr>
              </thead>

              <tbody>
                {sortedRanking.map((player, index) => (
                  <tr
                    key={player.id}
                    className="border-b border-gray-700"
                  >
                    <td className="py-2">{index + 1}</td>
                    <td>{player.name}</td>
                    <td>{player.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className={`rounded-3xl shadow-xl p-6 ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              対戦組み合わせ
            </h2>
          </div>

          <div className="space-y-4">
            {matches.length === 0 && (
              <p className="opacity-70">
                組み合わせがありません
              </p>
            )}

            {matches.map((match) => (
              <div
                key={match.id}
                className={`rounded-2xl p-4 ${
                  darkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <div className="font-bold text-lg mb-3">
                  第{match.matchNo}試合：{match.player1.name} VS {match.player2.name}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateResult(match.id, "p1")}
                    className={`px-4 py-2 rounded-xl ${
                      match.result === "p1"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-300 text-black"
                    }`}
                  >
                    {match.player1.name} 勝利
                  </button>

                  <button
                    onClick={() => updateResult(match.id, "draw")}
                    className={`px-4 py-2 rounded-xl ${
                      match.result === "draw"
                        ? "bg-yellow-500 text-white"
                        : "bg-gray-300 text-black"
                    }`}
                  >
                    引き分け
                  </button>

                  <button
                    onClick={() => updateResult(match.id, "p2")}
                    className={`px-4 py-2 rounded-xl ${
                      match.result === "p2"
                        ? "bg-red-600 text-white"
                        : "bg-gray-300 text-black"
                    }`}
                  >
                    {match.player2.name} 勝利
                  </button>
                </div>
              </div>
            ))}
          </div>

          {matches.length > 0 && (
            <button
              onClick={finalizeRound}
              className="mt-6 w-full bg-purple-600 text-white py-3 rounded-2xl text-lg font-bold"
            >
              ラウンド確定
            </button>
          )}
        </div>

        <div
          className={`rounded-3xl shadow-xl p-6 ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h2 className="text-2xl font-bold mb-4">
            戦績一覧
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedRanking.map((player) => (
              <div
                key={player.id}
                className={`rounded-2xl p-4 ${
                  darkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-bold text-lg">
                      {player.name}
                    </h3>
                    <p className="opacity-70 text-sm">
                      {player.points} pt
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {player.history.length === 0 && (
                    <p className="opacity-70 text-sm">
                      戦績なし
                    </p>
                  )}

                  {player.history.map((h, index) => (
                    <div
                      key={index}
                      className={`rounded-xl p-3 text-sm flex justify-between items-center ${
                        darkMode ? "bg-gray-800" : "bg-white"
                      }`}
                    >
                      <div>
                        R{h.round}: vs {h.opponent} - {h.result}
                      </div>

                      <button
                        onClick={() => editHistory(player.id, index)}
                        className="text-xs bg-orange-500 text-white px-2 py-1 rounded-lg"
                      >
                        編集
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
