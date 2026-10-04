import { useEffect, useRef, useState } from 'react'
import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Texture,
  Ticker,
  TilingSprite,
} from 'pixi.js'
import playerShipUrl from '../../../assets/png/default/ships/ship_5.png'
import chaserShipUrl from '../../../assets/png/default/ships/ship_2.png'
import cannonBallUrl from '../../../assets/png/default/ship_parts/cannon_ball.png'
import islandTopLeftUrl from '../../../assets/png/default/tiles/tile_1.png'
import islandTopUrl from '../../../assets/png/default/tiles/tile_2.png'
import islandTopRightUrl from '../../../assets/png/default/tiles/tile_3.png'
import islandLeftUrl from '../../../assets/png/default/tiles/tile_17.png'
import islandCenterUrl from '../../../assets/png/default/tiles/tile_18.png'
import islandRightUrl from '../../../assets/png/default/tiles/tile_19.png'
import islandBottomLeftUrl from '../../../assets/png/default/tiles/tile_33.png'
import islandBottomUrl from '../../../assets/png/default/tiles/tile_34.png'
import islandBottomRightUrl from '../../../assets/png/default/tiles/tile_35.png'
import waterTextureUrl from '../../../assets/png/default/tiles/tile_73.png'
import { GAME_CONFIG } from '../config/gameConfig'
import { GameLoop } from '../core/GameLoop'
import { createInitialGameState, updateGameState } from '../core/GameState'
import { KeyboardInput } from '../input/KeyboardInput'
import { installGameTestBridge } from '../testing/GameTestBridge'

type LoadState =
  | { status: 'loading'; progress: number }
  | { status: 'ready' }
  | { status: 'error' }

const PLAYER_SPRITE_ROTATION_OFFSET = Math.PI
const HEALTH_BAR_WIDTH = 52
const HEALTH_BAR_HEIGHT = 6

function drawHealthBar(
  graphics: Graphics,
  x: number,
  y: number,
  currentHealth: number,
  maximumHealth: number,
) {
  const healthRatio = Math.max(0, Math.min(1, currentHealth / maximumHealth))

  graphics
    .clear()
    .rect(-HEALTH_BAR_WIDTH / 2, 0, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT)
    .fill(0x4a1118)
    .rect(
      -HEALTH_BAR_WIDTH / 2,
      0,
      HEALTH_BAR_WIDTH * healthRatio,
      HEALTH_BAR_HEIGHT,
    )
    .fill(0x55d66b)
  graphics.position.set(x, y - 68)
}

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

        const islandAssetUrls = [
          islandTopLeftUrl,
          islandTopUrl,
          islandTopRightUrl,
          islandLeftUrl,
          islandCenterUrl,
          islandRightUrl,
          islandBottomLeftUrl,
          islandBottomUrl,
          islandBottomRightUrl,
        ]
        const assetUrls = [
          waterTextureUrl,
          playerShipUrl,
          cannonBallUrl,
          ...islandAssetUrls,
          chaserShipUrl,
        ]
        const loadedTextures: Texture[] = []
        for (const assetUrl of assetUrls) {
          loadedTextures.push(await Assets.load<Texture>(assetUrl))

          if (!disposed) {
            setLoadState({
              status: 'loading',
              progress: Math.round(
                (loadedTextures.length / assetUrls.length) * 100,
              ),
            })
          }
        }

        if (disposed) {
          destroyApplication()
          return
        }

        const [waterTexture, playerTexture, cannonBallTexture] = loadedTextures
        const islandTextures = loadedTextures.slice(3, 12)
        const chaserTexture = loadedTextures[12]
        if (
          !waterTexture ||
          !playerTexture ||
          !cannonBallTexture ||
          !chaserTexture ||
          islandTextures.length !== 9
        ) {
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
        const islandLayer = new Container()
        for (const island of GAME_CONFIG.islands) {
          const islandContainer = new Container()
          islandContainer.position.set(island.x, island.y)

          islandTextures.forEach((texture, index) => {
            const tile = new Sprite(texture)
            tile.position.set((index % 3) * 64, Math.floor(index / 3) * 64)
            islandContainer.addChild(tile)
          })

          islandLayer.addChild(islandContainer)
        }
        const projectileLayer = new Container()
        const projectileSprites = new Map<number, Sprite>()
        const enemyLayer = new Container()
        const enemySprites = new Map<number, Sprite>()
        const healthBarLayer = new Container()
        const enemyHealthBars = new Map<number, Graphics>()
        const playerShip = new Sprite(playerTexture)
        const playerHealthBar = new Graphics()
        playerShip.anchor.set(0.5)
        playerShip.scale.set(0.9)
        world.addChild(
          water,
          islandLayer,
          projectileLayer,
          enemyLayer,
          playerShip,
          healthBarLayer,
        )
        healthBarLayer.addChild(playerHealthBar)
        application.stage.addChild(world)

        let gameState = createInitialGameState(GAME_CONFIG)
        const keyboardInput = new KeyboardInput(window)
        const removeTestBridge = installGameTestBridge(() => gameState)
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
          playerShip.rotation =
            gameState.player.rotation + PLAYER_SPRITE_ROTATION_OFFSET
          drawHealthBar(
            playerHealthBar,
            gameState.player.x,
            gameState.player.y,
            gameState.player.health,
            GAME_CONFIG.player.maxHealth,
          )

          const activeEnemyIds = new Set(
            gameState.enemies.map((enemy) => enemy.id),
          )

          for (const [id, sprite] of enemySprites) {
            if (!activeEnemyIds.has(id)) {
              enemyLayer.removeChild(sprite)
              sprite.destroy()
              enemySprites.delete(id)

              const healthBar = enemyHealthBars.get(id)
              if (healthBar) {
                healthBarLayer.removeChild(healthBar)
                healthBar.destroy()
                enemyHealthBars.delete(id)
              }
            }
          }

          for (const enemy of gameState.enemies) {
            let sprite = enemySprites.get(enemy.id)

            if (!sprite) {
              sprite = new Sprite(chaserTexture)
              sprite.anchor.set(0.5)
              sprite.scale.set(0.85)
              enemyLayer.addChild(sprite)
              enemySprites.set(enemy.id, sprite)

              const healthBar = new Graphics()
              healthBarLayer.addChild(healthBar)
              enemyHealthBars.set(enemy.id, healthBar)
            }

            sprite.position.set(enemy.x, enemy.y)
            sprite.rotation =
              enemy.rotation + PLAYER_SPRITE_ROTATION_OFFSET

            const healthBar = enemyHealthBars.get(enemy.id)
            if (healthBar) {
              drawHealthBar(
                healthBar,
                enemy.x,
                enemy.y,
                enemy.health,
                GAME_CONFIG.chaser.maxHealth,
              )
            }
          }

          const activeProjectileIds = new Set(
            gameState.projectiles.map((projectile) => projectile.id),
          )

          for (const [id, sprite] of projectileSprites) {
            if (!activeProjectileIds.has(id)) {
              projectileLayer.removeChild(sprite)
              sprite.destroy()
              projectileSprites.delete(id)
            }
          }

          for (const projectile of gameState.projectiles) {
            let sprite = projectileSprites.get(projectile.id)

            if (!sprite) {
              sprite = new Sprite(cannonBallTexture)
              sprite.anchor.set(0.5)
              sprite.scale.set(1.4)
              projectileLayer.addChild(sprite)
              projectileSprites.set(projectile.id, sprite)
            }

            sprite.position.set(projectile.x, projectile.y)
          }
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
          removeTestBridge()
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
