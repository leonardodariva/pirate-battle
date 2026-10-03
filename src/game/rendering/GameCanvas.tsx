import { useEffect, useRef, useState } from 'react'
import {
  Application,
  Assets,
  Container,
  Sprite,
  Texture,
  Ticker,
  TilingSprite,
} from 'pixi.js'
import playerShipUrl from '../../../assets/png/default/ships/ship_5.png'
import waterTextureUrl from '../../../assets/png/default/tiles/tile_73.png'
import { GAME_CONFIG } from '../config/gameConfig'
import { GameLoop } from '../core/GameLoop'
import { createInitialGameState, updateGameState } from '../core/GameState'
import { KeyboardInput } from '../input/KeyboardInput'

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
    let applicationInitialized = false
    let applicationDestroyed = false
    let resizeObserver: ResizeObserver | undefined
    let removeRuntimeListeners = () => {}
    const application = new Application()

    const destroyApplication = () => {
      if (applicationInitialized && !applicationDestroyed) {
        application.destroy(true, { children: true })
        applicationDestroyed = true
      }
    }

    async function initialize(hostElement: HTMLDivElement) {
      try {
        setLoadState({ status: 'loading', progress: 0 })

        await application.init({
          antialias: true,
          autoDensity: true,
          backgroundColor: 0x031923,
          resolution: Math.min(window.devicePixelRatio, 2),
        })
        applicationInitialized = true

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
          destroyApplication()
          return
        }

        const [waterTexture, playerTexture] = loadedTextures
        if (!waterTexture || !playerTexture) {
          throw new Error('The required game textures were not loaded.')
        }

        application.canvas.setAttribute('aria-hidden', 'true')
        hostElement.appendChild(application.canvas)

        const world = new Container()
        const water = new TilingSprite({
          texture: waterTexture,
          width: GAME_CONFIG.arena.width,
          height: GAME_CONFIG.arena.height,
        })
        const playerShip = new Sprite(playerTexture)
        playerShip.anchor.set(0.5)
        playerShip.scale.set(0.9)
        world.addChild(water, playerShip)
        application.stage.addChild(world)

        let gameState = createInitialGameState(GAME_CONFIG)
        const keyboardInput = new KeyboardInput(window)
        const gameLoop = new GameLoop(
          GAME_CONFIG.loop.fixedStepSeconds,
          GAME_CONFIG.loop.maxFrameDeltaSeconds,
          (fixedStepSeconds) => {
            gameState = updateGameState(
              gameState,
              keyboardInput.read(),
              fixedStepSeconds,
              GAME_CONFIG,
            )
          },
        )

        const renderScene = () => {
          playerShip.position.set(gameState.player.x, gameState.player.y)
          playerShip.rotation = gameState.player.rotation
        }

        const handleTick = (ticker: Ticker) => {
          gameLoop.advance(ticker.deltaMS / 1000)
          renderScene()
        }

        const layoutScene = () => {
          const width = Math.max(hostElement.clientWidth, 1)
          const height = Math.max(hostElement.clientHeight, 1)
          const worldScale = Math.min(
            width / GAME_CONFIG.arena.width,
            height / GAME_CONFIG.arena.height,
          )

          application.renderer.resize(width, height)
          world.scale.set(worldScale)
          world.position.set(
            (width - GAME_CONFIG.arena.width * worldScale) / 2,
            (height - GAME_CONFIG.arena.height * worldScale) / 2,
          )
        }

        application.ticker.add(handleTick)
        resizeObserver = new ResizeObserver(layoutScene)
        resizeObserver.observe(hostElement)
        removeRuntimeListeners = () => {
          application.ticker.remove(handleTick)
          gameLoop.reset()
          keyboardInput.destroy()
        }

        renderScene()
        layoutScene()
        setLoadState({ status: 'ready' })
      } catch (error) {
        console.error('Unable to load game assets.', error)
        destroyApplication()

        if (!disposed) {
          setLoadState({ status: 'error' })
        }
      }
    }

    void initialize(host)

    return () => {
      disposed = true
      resizeObserver?.disconnect()
      removeRuntimeListeners()
      destroyApplication()
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
