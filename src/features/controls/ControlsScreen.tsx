import fireFrontIconUrl from '../../../assets/png/default/ui/controls/icon_fire_front.png'
import fireLeftIconUrl from '../../../assets/png/default/ui/controls/icon_fire_left.png'
import fireRightIconUrl from '../../../assets/png/default/ui/controls/icon_fire_right.png'
import forwardIconUrl from '../../../assets/png/default/ui/controls/icon_forward.png'

interface ControlsScreenProps {
  onBack: () => void
}

const touchControls = [
  {
    icon: forwardIconUrl,
    name: 'Joystick direction',
    description: 'Point anywhere to steer and move. Distance controls speed.',
  },
  {
    icon: fireFrontIconUrl,
    name: 'Front cannon',
    description: 'Fires one projectile in the direction of the bow.',
  },
  {
    icon: fireLeftIconUrl,
    name: 'Left broadside',
    description: 'Fires three parallel projectiles from the port side.',
  },
  {
    icon: fireRightIconUrl,
    name: 'Right broadside',
    description: 'Fires three parallel projectiles from the starboard side.',
  },
]

export function ControlsScreen({ onBack }: ControlsScreenProps) {
  return (
    <main className="controls-screen">
      <section className="controls-card" aria-labelledby="controls-title">
        <header className="controls-header">
          <div>
            <p className="eyebrow">Captain's guide</p>
            <h1 id="controls-title">Controls</h1>
          </div>
          <button className="secondary-button" onClick={onBack}>
            Back
          </button>
        </header>

        <div className="controls-grid">
          <section aria-labelledby="keyboard-controls-title">
            <h2 id="keyboard-controls-title">Keyboard</h2>
            <dl className="keyboard-controls-list">
              <div><dt><kbd>W</kbd> / <kbd>↑</kbd></dt><dd>Move forward</dd></div>
              <div><dt><kbd>A</kbd> / <kbd>←</kbd></dt><dd>Rotate left</dd></div>
              <div><dt><kbd>D</kbd> / <kbd>→</kbd></dt><dd>Rotate right</dd></div>
              <div><dt><kbd>Space</kbd></dt><dd>Front cannon</dd></div>
              <div><dt><kbd>Q</kbd></dt><dd>Left broadside</dd></div>
              <div><dt><kbd>E</kbd></dt><dd>Right broadside</dd></div>
              <div><dt><kbd>Esc</kbd></dt><dd>Pause or continue</dd></div>
            </dl>
          </section>

          <section aria-labelledby="touch-controls-title">
            <h2 id="touch-controls-title">Touch</h2>
            <ul className="touch-controls-list">
              {touchControls.map((control) => (
                <li key={control.name}>
                  <img src={control.icon} alt="" aria-hidden="true" />
                  <span>
                    <strong>{control.name}</strong>
                    <small>{control.description}</small>
                  </span>
                </li>
              ))}
            </ul>
            <p className="controls-tip">
              Use the joystick and a weapon button with different fingers.
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}
