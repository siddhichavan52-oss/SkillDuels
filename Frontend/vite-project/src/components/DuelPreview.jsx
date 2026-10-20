import { Icon } from './Icons'

// Static, decorative snapshot of a live duel. The tug bar settles once on load.
export default function DuelPreview() {
  return (
    <div className="dp" aria-hidden="true">
      <div className="dp-head">
        <div className="dp-player">
          <span className="avatar" style={{ width: 40, height: 40, background: '#FFC93C', fontSize: 15 }}>AS</span>
          <div>
            <strong>Ava</strong>
            <span>Challenger</span>
          </div>
        </div>
        <div className="dp-scores">
          <span className="dp-score dp-score-you">380</span>
          <span className="dp-dash">:</span>
          <span className="dp-score dp-score-foe">290</span>
        </div>
        <div className="dp-player dp-player-end">
          <div>
            <strong>Kabir</strong>
            <span>Strategist</span>
          </div>
          <span className="avatar" style={{ width: 40, height: 40, background: '#6CC4FF', fontSize: 15 }}>KS</span>
        </div>
      </div>

      <div className="tug tug-dp">
        <span className="tug-you" />
        <span className="tug-foe" />
      </div>

      <div className="dp-q">
        <div className="dp-q-meta">
          <span>Question 4 of 6</span>
          <span className="dp-timer"><Icon name="clock" size={15} /> 9s</span>
        </div>
        <div className="timer-bar dp-bar"><span style={{ width: '60%' }} /></div>
        <p>Which JOIN returns only rows that have matches in both tables?</p>
        <div className="dp-opts">
          <span className="dp-opt dp-opt-right"><b>A</b> INNER JOIN <em className="dp-gain">+138</em></span>
          <span className="dp-opt"><b>B</b> LEFT JOIN</span>
          <span className="dp-opt"><b>C</b> FULL OUTER JOIN<i className="opp-mark">K</i></span>
          <span className="dp-opt"><b>D</b> CROSS JOIN</span>
        </div>
      </div>
    </div>
  )
}
