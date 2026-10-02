import { useEffect, useRef, useState } from 'react'
import { Application, Assets, Sprite, Texture, TilingSprite } from 'pixi.js'
import playerShipUrl from '../../../assets/png/default/ships/ship_5.png'
import waterTextureUrl from '../../../assets/png/default/tiles/tile_73.png'

type LoadState =
  | { status: 'loading'; progress: number }
  | { status: 'ready' }
  | { status: 'error' }

export function GameCanvas() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [loadState, setLoadState] = useState<LoadState>({
    status: 'loading',
    progress: 0,
  })
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    const host = hostRef.current

    if (!host) {
      return
    }

    let disposed = false
    let resizeObserver: ResizeObserver | undefined
    let application: Application | undefined

    async function initialize(hostElement: HTMLDivElement) {
      const app = new Application()
      application = app

      try {
        setLoadState({ status: 'loading', progress: 0 })

        await app.init({
          antialias: true,
          autoDensity: true,
          backgroundColor: 0x168fba,
          resolution: Math.min(window.devicePixelRatio, 2),
        })

        const loadedTextures: Texture[] = []
        for (const assetUrl of [waterTextureUrl, playerShipUrl]) {
          loadedTextures.push(await Assets.load<Texture>(assetUrl))

          if (!disposed) {
            setLoadState({
              status: 'loading',
              progress: loadedTextures.length * 50,
            })
          }
        }

        if (disposed) {
          app.destroy(true, { children: true })
          return
        }

        const [waterTexture, playerTexture] = loadedTextures
        if (!waterTexture || !playerTexture) {
          throw new Error('The required game textures were not loaded.')
        }

        app.canvas.setAttribute('aria-hidden', 'true')
        hostElement.appendChild(app.canvas)

        const water = new TilingSprite({
          texture: waterTexture,
          width: 1,
          height: 1,
        })
        const playerShip = new Sprite(playerTexture)
        playerShip.anchor.set(0.5)
        playerShip.scale.set(0.9)
        app.stage.addChild(water, playerShip)

        const layoutScene = () => {
          const width = Math.max(hostElement.clientWidth, 1)
          const height = Math.max(hostElement.clientHeight, 1)
          app.renderer.resize(width, height)
          water.width = width
          water.height = height
          playerShip.position.set(width / 2, height / 2)
        }

        resizeObserver = new ResizeObserver(layoutScene)
        resizeObserver.observe(hostElement)
        layoutScene()
        setLoadState({ status: 'ready' })
      } catch (error) {
        console.error('Unable to load game assets.', error)

        if (!disposed) {
          setLoadState({ status: 'error' })
        }
      }
    }

    void initialize(host)

    return () => {
      disposed = true
      resizeObserver?.disconnect()

      if (application?.renderer) {
        application.destroy(true, { children: true })
      }
    }
  }, [loadAttempt])

  return (
    <div className="game-canvas-shell">
      <div ref={hostRef} className="game-canvas" />

      {loadState.status === 'loading' && (
        <div className="asset-status" role="status">
          Loading assets... {loadState.progress}%
        </div>
      )}

      {loadState.status === 'error' && (
        <div className="asset-status" role="alert">
          <p>Unable to load assets.</p>
          <button
            className="primary-button"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
