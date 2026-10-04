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
import shooterShipUrl from '../../../assets/png/default/ships/ship_3.png'
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
import playerHealthFrameUrl from '../../../assets/png/default/ui/hud/health_frame.png'
import playerHealthGreenUrl from '../../../assets/png/default/ui/hud/health_fill_green.png'
import playerHealthAmberUrl from '../../../assets/png/default/ui/hud/health_fill_amber.png'
import playerHealthRedUrl from '../../../assets/png/default/ui/hud/health_fill_red.png'
import enemyHealthFrameUrl from '../../../assets/png/default/ui/hud/enemy_health_frame.png'
import enemyHealthGreenUrl from '../../../assets/png/default/ui/hud/enemy_health_fill_green.png'
import enemyHealthRedUrl from '../../../assets/png/default/ui/hud/enemy_health_fill_red.png'
import { GAME_CONFIG } from '../config/gameConfig'
import { GameLoop } from '../core/GameLoop'
import { createInitialGameState, updateGameState } from '../core/GameState'
import { KeyboardInput } from '../input/KeyboardInput'
import { getEnemyMaxHealth } from '../systems/EnemySystem'
import { installGameTestBridge } from '../testing/GameTestBridge'

type LoadState =
  | { status: 'loading'; progress: number }
  | { status: 'ready' }
  | { status: 'error' }

const PLAYER_SPRITE_ROTATION_OFFSET = Math.PI
const PLAYER_HEALTH_BAR = {
  width: 256,
  height: 48,
  fillX: 30,
  fillY: 15,
  fillWidth: 196,
  fillHeight: 20,
  scale: 0.32,
  offsetY: 72,
}
const ENEMY_HEALTH_BAR = {
  width: 160,
  height: 40,
  fillX: 24,
  fillY: 12,
  fillWidth: 112,
  fillHeight: 15,
  scale: 0.36,
  offsetY: 66,
}

interface HealthBarView {
  container: Container
  fill: Sprite
  mask: Graphics
}

function createHealthBar(
  frameTexture: Texture,
  fillTexture: Texture,
  metrics: typeof PLAYER_HEALTH_BAR,
): HealthBarView {
  const container = new Container()
  const frame = new Sprite(frameTexture)
  const fill = new Sprite(fillTexture)
  const mask = new Graphics()

  fill.mask = mask
  container.addChild(frame, fill, mask)
  container.pivot.set(metrics.width / 2, metrics.height / 2)
  container.scale.set(metrics.scale)

  return { container, fill, mask }
}

function updateHealthBar(
  view: HealthBarView,
  x: number,
  y: number,
  currentHealth: number,
  maximumHealth: number,
  fillTexture: Texture,
  metrics: typeof PLAYER_HEALTH_BAR,
) {
  const healthRatio = Math.max(0, Math.min(1, currentHealth / maximumHealth))

  view.fill.texture = fillTexture
  view.mask
    .clear()
    .rect(
      metrics.fillX,
      metrics.fillY,
      metrics.fillWidth * healthRatio,
      metrics.fillHeight,
    )
    .fill(0xffffff)
  view.container.position.set(x, y - metrics.offsetY)
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
          shooterShipUrl,
          playerHealthFrameUrl,
          playerHealthGreenUrl,
          playerHealthAmberUrl,
          playerHealthRedUrl,
          enemyHealthFrameUrl,
          enemyHealthGreenUrl,
          enemyHealthRedUrl,
        ]
        const loadedTextures = new Map<string, Texture>()
        for (const assetUrl of assetUrls) {
          loadedTextures.set(assetUrl, await Assets.load<Texture>(assetUrl))

          if (!disposed) {
            setLoadState({
              status: 'loading',
              progress: Math.round(
                (loadedTextures.size / assetUrls.length) * 100,
              ),
            })
          }
        }

        if (disposed) {
          destroyApplication()
          return
        }

        const getTexture = (assetUrl: string) => {
          const texture = loadedTextures.get(assetUrl)

          if (!texture) {
            throw new Error(`The required texture was not loaded: ${assetUrl}`)
          }

          return texture
        }
        const waterTexture = getTexture(waterTextureUrl)
        const playerTexture = getTexture(playerShipUrl)
        const cannonBallTexture = getTexture(cannonBallUrl)
        const chaserTexture = getTexture(chaserShipUrl)
        const shooterTexture = getTexture(shooterShipUrl)
        const islandTextures = islandAssetUrls.map(getTexture)
        const playerHealthFrameTexture = getTexture(playerHealthFrameUrl)
        const playerHealthGreenTexture = getTexture(playerHealthGreenUrl)
        const playerHealthAmberTexture = getTexture(playerHealthAmberUrl)
        const playerHealthRedTexture = getTexture(playerHealthRedUrl)
        const enemyHealthFrameTexture = getTexture(enemyHealthFrameUrl)
        const enemyHealthGreenTexture = getTexture(enemyHealthGreenUrl)
        const enemyHealthRedTexture = getTexture(enemyHealthRedUrl)

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
        const enemyHealthBars = new Map<number, HealthBarView>()
        const playerShip = new Sprite(playerTexture)
        const playerHealthBar = createHealthBar(
          playerHealthFrameTexture,
          playerHealthGreenTexture,
          PLAYER_HEALTH_BAR,
        )
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
        healthBarLayer.addChild(playerHealthBar.container)
        application.stage.addChild(world)

        let gameState = createInitialGameState(GAME_CONFIG)
        const keyboardInput = new KeyboardInput(window)
        const removeTestBridge = installGameTestBridge(
          () => gameState,
          (setup) => {
            gameState = {
              ...gameState,
              player: {
                ...gameState.player,
                ...setup,
              },
            }
          },
          (setup) => {
            gameState = {
              ...gameState,
              enemies: [
                {
                  id: 1,
                  type: 'chaser',
                  ...setup,
                },
              ],
            }
          },
          (setup) => {
            gameState = {
              ...gameState,
              enemies: [
                {
                  id: 2,
                  type: 'shooter',
                  x: setup.x,
                  y: setup.y,
                  rotation: setup.rotation,
                  health: setup.health,
                  fireCooldownRemaining:
                    setup.fireCooldownRemaining ?? 0,
                },
              ],
            }
          },
        )
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
          const playerHealthFill =
            gameState.player.health > GAME_CONFIG.player.maxHealth * 0.5
              ? playerHealthGreenTexture
              : gameState.player.health > GAME_CONFIG.player.maxHealth * 0.25
                ? playerHealthAmberTexture
                : playerHealthRedTexture
          updateHealthBar(
            playerHealthBar,
            gameState.player.x,
            gameState.player.y,
            gameState.player.health,
            GAME_CONFIG.player.maxHealth,
            playerHealthFill,
            PLAYER_HEALTH_BAR,
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
                healthBarLayer.removeChild(healthBar.container)
                healthBar.container.destroy({ children: true })
                enemyHealthBars.delete(id)
              }
            }
          }

          for (const enemy of gameState.enemies) {
            let sprite = enemySprites.get(enemy.id)

            if (!sprite) {
              sprite = new Sprite(
                enemy.type === 'chaser' ? chaserTexture : shooterTexture,
              )
              sprite.anchor.set(0.5)
              sprite.scale.set(0.85)
              enemyLayer.addChild(sprite)
              enemySprites.set(enemy.id, sprite)

              const healthBar = createHealthBar(
                enemyHealthFrameTexture,
                enemyHealthGreenTexture,
                ENEMY_HEALTH_BAR,
              )
              healthBarLayer.addChild(healthBar.container)
              enemyHealthBars.set(enemy.id, healthBar)
            }

            sprite.position.set(enemy.x, enemy.y)
            sprite.rotation =
              enemy.rotation + PLAYER_SPRITE_ROTATION_OFFSET

            const healthBar = enemyHealthBars.get(enemy.id)
            if (healthBar) {
              const maximumHealth = getEnemyMaxHealth(enemy, GAME_CONFIG)
              updateHealthBar(
                healthBar,
                enemy.x,
                enemy.y,
                enemy.health,
                maximumHealth,
                enemy.health > maximumHealth * 0.5
                  ? enemyHealthGreenTexture
                  : enemyHealthRedTexture,
                ENEMY_HEALTH_BAR,
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
