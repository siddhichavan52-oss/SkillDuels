// Real-time layer for duels.
//
// Match.jsx talks to an opponent only through a "channel" object:
//
//   channel.questionStarted({ index, question, seconds })  a new question opened
//   channel.sendAnswer(payload)                            I answered
//   channel.onOpponentAnswer(cb) -> unsubscribe            opponent answered
//   channel.onOpponentLeave(cb)  -> unsubscribe            opponent left the match
//   channel.leave()                                        I forfeited
//   channel.close()                                        clean up
//
// Two implementations ship with the frontend:
//
//   1. createLiveChannel: real two-player duels between two browser tabs, using the
//      BroadcastChannel API. Sign in as different players in two tabs to demo a live
//      duel without a server.
//   2. createBotChannel: a practice opponent for when nobody else is online.
//
// Moving to Socket.IO later means writing a third implementation with the same shape:
//
//   import { io } from 'socket.io-client'
//   const socket = io(import.meta.env.VITE_API_URL, { auth: { token } })
//   export const createSocketChannel = ({ matchId }) => ({
//     questionStarted() {},
//     sendAnswer: (p) => socket.emit('match:answer', { matchId, ...p }),
//     onOpponentAnswer: (cb) => { socket.on('match:opponentAnswer', cb); return () => socket.off('match:opponentAnswer', cb) },
//     onOpponentLeave: (cb) => { socket.on('match:opponentLeft', cb); return () => socket.off('match:opponentLeft', cb) },
//     leave: () => socket.emit('match:leave', { matchId }),
//     close() {},
//   })
//
// Matchmaking (searchForOpponent) maps to socket.emit('queue:join', { categoryId })
// and a 'match:found' event from the server.

import { scorePoints, uid } from './utils'

const LOBBY_CHANNEL = 'skillduels-lobby'
const TAB_ID = uid('tab')

export const liveSupported = () => typeof BroadcastChannel !== 'undefined'

const publicPlayer = (u) => ({ id: u.id, name: u.name, avatarColor: u.avatarColor, xp: u.xp })

/* ---------- Matchmaking ---------- */

// Broadcasts "I'm looking for a duel in this category" until another tab answers.
// The tab with the lower id becomes host and sends the shared question set, so both
// players always get identical questions (AC-01).
export function searchForOpponent({ me, categoryId, makeQuestions, onFound }) {
  if (!liveSupported()) return () => {}
  const lobby = new BroadcastChannel(LOBBY_CHANNEL)
  let settled = false

  const announce = () => lobby.postMessage({ type: 'looking', tab: TAB_ID, categoryId, player: publicPlayer(me) })
  const timer = setInterval(announce, 600)
  announce()

  const finish = (info) => {
    settled = true
    clearInterval(timer)
    onFound(info)
    setTimeout(() => lobby.close(), 400)
  }

  lobby.onmessage = ({ data }) => {
    if (settled || !data) return
    if (data.type === 'looking' && data.categoryId === categoryId && data.player.id !== me.id) {
      if (TAB_ID < data.tab) {
        const matchId = uid('m')
        const questions = makeQuestions()
        lobby.postMessage({ type: 'paired', to: data.tab, matchId, questions, host: publicPlayer(me) })
        finish({ matchId, questions, opponent: data.player })
      }
    } else if (data.type === 'paired' && data.to === TAB_ID) {
      finish({ matchId: data.matchId, questions: data.questions, opponent: data.host })
    }
  }

  // Cancelling after a pairing was made is a no-op: finish() closes the channel itself.
  return () => {
    if (settled) return
    settled = true
    clearInterval(timer)
    lobby.close()
  }
}

/* ---------- Live channel (two real players) ---------- */

export function createLiveChannel({ matchId, meId }) {
  const bc = new BroadcastChannel(`skillduels-match-${matchId}`)
  const onAnswer = new Set()
  const onLeave = new Set()

  bc.onmessage = ({ data }) => {
    if (!data || data.from === meId) return
    if (data.type === 'answer') onAnswer.forEach((cb) => cb(data.payload))
    if (data.type === 'leave') onLeave.forEach((cb) => cb())
  }

  return {
    kind: 'live',
    questionStarted() {},
    sendAnswer: (payload) => bc.postMessage({ type: 'answer', from: meId, payload }),
    onOpponentAnswer(cb) {
      onAnswer.add(cb)
      return () => onAnswer.delete(cb)
    },
    onOpponentLeave(cb) {
      onLeave.add(cb)
      return () => onLeave.delete(cb)
    },
    leave: () => bc.postMessage({ type: 'leave', from: meId }),
    close: () => bc.close(),
  }
}

/* ---------- Practice bot ---------- */

export function createBotChannel(bot) {
  let timers = []
  let listener = null
  let closed = false

  return {
    kind: 'bot',
    questionStarted({ index, question, seconds }) {
      if (Math.random() < 0.07) return // occasionally the bot runs out of time
      const maxDelay = Math.max(bot.minTime, Math.min(bot.maxTime, seconds - 2))
      const delay = bot.minTime + Math.random() * (maxDelay - bot.minTime)
      timers.push(
        setTimeout(() => {
          if (closed || !listener) return
          const correct = Math.random() < bot.accuracy
          const wrong = [0, 1, 2, 3].filter((i) => i !== question.answer)
          const choice = correct ? question.answer : wrong[Math.floor(Math.random() * wrong.length)]
          listener({
            q: index,
            choice,
            correct,
            points: correct ? scorePoints(seconds - delay, seconds) : 0,
            time: +delay.toFixed(1),
          })
        }, delay * 1000),
      )
    },
    sendAnswer() {},
    onOpponentAnswer(cb) {
      listener = cb
      return () => {
        listener = null
      }
    },
    onOpponentLeave: () => () => {},
    leave() {
      this.close()
    },
    close() {
      closed = true
      timers.forEach(clearTimeout)
      timers = []
    },
  }
}
