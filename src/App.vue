<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import freeBadge from './assets/ai-hero-free-badge.png'
import gptLogo from './assets/ai-models-logo-gpt.svg'
import seedanceLogo from './assets/ai-models-logo-seedance.svg'
import nanoLogo from './assets/ai-models-logo-nano-banana.svg'
import tomovieeLogo from './assets/ai-models-logo-tomoviee.svg'
import klingLogo from './assets/ai-models-logo-kling.svg'
import videoImage from './assets/ai-effects-demo-video-after.png'
import videoBeforeImage from './assets/ai-effects-demo-video-before.png'
import imageEffectsImage from './assets/ai-effects-demo-main.png'
import makeoverImage from './assets/ai-effects-demo-makeover-after.png'
import marketingImage from './assets/ai-effects-demo-marketing-post.png'
import marketingStoryImage from './assets/ai-effects-demo-marketing-story.png'
import socialImage from './assets/ai-effects-demo-social-post.png'
import socialCoverImage from './assets/ai-effects-demo-social-cover.png'
import mediaioLogo from './assets/mediaio-logo.svg'

const connectorUrl = 'https://mcp.media.io/mcp'

const hosts = [
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    icon: '◎',
    cta: 'Add Connector',
    mode: 'connector',
    detail: 'Add the Media.io MCP connector manually in ChatGPT, then sign in when prompted.'
  },
  {
    id: 'codex',
    label: 'Codex',
    icon: '⌘',
    cta: 'Set up in Codex',
    mode: 'cli',
    detail: 'Copy the setup prompt to Codex. It will install or update Media.io CLI and guide you through sign-in.'
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    icon: '✺',
    cta: 'Set up in Claude Code',
    mode: 'cli',
    detail: 'Copy the setup prompt to Claude Code. It will configure Media.io CLI in your current workflow.'
  },
  {
    id: 'claude',
    label: 'Claude',
    icon: '✦',
    cta: 'Add to Claude',
    mode: 'claude-connector',
    detail: 'Open Claude with the Media.io connector prefilled. You only need to confirm and sign in.'
  },
  {
    id: 'cursor',
    label: 'Cursor',
    icon: '↗',
    cta: 'Set up in Cursor',
    mode: 'cli',
    detail: 'Install Media.io CLI from Cursor’s agent workflow, then start creating in your editor.'
  },
  {
    id: 'more',
    label: 'More agents',
    icon: '···',
    cta: 'Copy setup prompt',
    mode: 'cli',
    detail: 'Send the setup prompt to another agent that can run CLI commands.'
  }
]

const scenes = [
  {
    id: 'image-effects',
    label: 'AI Image Effects',
    eyebrow: 'Instant visual transformations',
    title: 'Transform any image.',
    copy: 'Apply cinematic material, lighting, and motion-ready effects without leaving your AI agent.',
    prompt: '@Media.io Transform this product shot with an iridescent chrome liquid effect, deep violet lighting, and a clean luxury campaign finish.',
    asset: imageEffectsImage,
    className: 'scene-image-effects',
    badge: 'Image → effect'
  },
  {
    id: 'makeover',
    label: 'Character Makeover',
    eyebrow: 'Keep the identity. Change the world.',
    title: 'Reinvent a character.',
    copy: 'Build consistent character variations for stories, series, and campaign concepts in a single prompt.',
    prompt: '@Media.io Reimagine this character as a futuristic fashion editor while preserving face identity, pose, and cinematic lighting.',
    asset: makeoverImage,
    className: 'scene-makeover',
    badge: 'Character → looks'
  },
  {
    id: 'marketing',
    label: 'Marketing Visuals',
    eyebrow: 'Brief to campaign system',
    title: 'Build campaign visuals.',
    copy: 'Generate a hero asset, social crops, and high-converting variants from one product brief.',
    prompt: '@Media.io Create a premium launch visual system for this product: a hero image, three paid social variations, and a vertical story asset.',
    asset: marketingImage,
    className: 'scene-marketing',
    badge: 'Product → campaign'
  },
  {
    id: 'social',
    label: 'Social Content',
    eyebrow: 'Always on-brand, everywhere',
    title: 'Create social-ready content.',
    copy: 'Move from a single idea to on-brand visuals formatted for your next post, story, or launch.',
    prompt: '@Media.io Turn this campaign concept into an editorial social post and a matching vertical cover with a bold, playful visual language.',
    asset: socialImage,
    className: 'scene-social',
    badge: 'Idea → social set'
  },
  {
    id: 'video',
    label: 'AI Video Effects',
    eyebrow: 'Make every frame cinematic',
    title: 'Make video feel cinematic.',
    copy: 'Create effects-led video directions with motion, lighting, and atmosphere that support the story.',
    prompt: '@Media.io Give this clip a cinematic energy trail, high-contrast violet lighting, and slow forward camera movement.',
    asset: videoImage,
    className: 'scene-video',
    badge: 'Video → motion effect'
  }
]

const modelCards = [
  { id: 'tomoviee-image-pro', name: 'ToMoviee 3.0 Pro', type: 'Image', badge: 'VIP FREE', logo: tomovieeLogo, preview: marketingImage },
  { id: 'gpt-image', name: 'GPT Image 2', type: 'Image', logo: gptLogo, preview: socialImage },
  { id: 'tomoviee-lite', name: 'ToMoviee Lite', type: 'Image', badge: 'FREE', logo: tomovieeLogo, preview: imageEffectsImage },
  { id: 'nano-banana', name: 'Nano Banana 2', type: 'Image', logo: nanoLogo, preview: makeoverImage },
  { id: 'tomoviee-video', name: 'ToMoviee 3.0', type: 'Video', badge: 'VIP FREE', logo: tomovieeLogo, preview: videoImage },
  { id: 'seedance', name: 'Seedance 2.5', type: 'Video', logo: seedanceLogo, preview: videoBeforeImage },
  { id: 'kling', name: 'Kling 3.0', type: 'Video', logo: klingLogo, preview: marketingStoryImage },
  { id: 'tomoviee-video-fast', name: 'ToMoviee 2.0 Fast', type: 'Video', badge: 'VIP FREE', logo: tomovieeLogo, preview: socialCoverImage }
]

const activeHostId = ref('codex')
const activeSceneId = ref('image-effects')
const copiedTarget = ref('')
const showcaseViewport = ref(null)
const modelRail = ref(null)

const activeHost = computed(() => hosts.find((host) => host.id === activeHostId.value))
const activeSceneIndex = computed(() => scenes.findIndex((scene) => scene.id === activeSceneId.value))
const setupTarget = computed(() => activeHost.value.id === 'more' ? 'your agent' : activeHost.value.label)
let scrollSyncTimer
let modelScrollFrame = 0
let modelRailUserControlled = false

const setupPrompt = computed(() => `Set up Media.io for me so I can create images and videos from ${setupTarget.value}.\n\n1. Install or update Media.io for my operating system:\nmacOS: curl -fsSL https://raw.githubusercontent.com/media-io/cli/refs/heads/main/setup-mediaio.sh | sh\nWindows (PowerShell): irm https://raw.githubusercontent.com/media-io/cli/refs/heads/main/setup-mediaio.ps1 | iex\n\n2. Help me sign in if needed, then let me know when Media.io is ready.`)

const claudeUrl = `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=${encodeURIComponent('Media.io')}&connectorUrl=${encodeURIComponent(connectorUrl)}`

function selectHost(host) {
  activeHostId.value = host.id
  copiedTarget.value = ''
}

function selectScene(scene) {
  activeSceneId.value = scene.id
  const index = scenes.findIndex((item) => item.id === scene.id)
  showcaseViewport.value?.scrollTo({ left: index * showcaseViewport.value.clientWidth, behavior: 'smooth' })
}

function syncSceneFromScroll() {
  const viewport = showcaseViewport.value
  if (!viewport?.clientWidth) return
  window.clearTimeout(scrollSyncTimer)
  scrollSyncTimer = window.setTimeout(() => {
    const index = Math.round(viewport.scrollLeft / viewport.clientWidth)
    if (scenes[index]) activeSceneId.value = scenes[index].id
  }, 90)
}

function moveScene(direction) {
  const nextScene = scenes[activeSceneIndex.value + direction]
  if (nextScene) selectScene(nextScene)
}

function markModelRailManual() {
  modelRailUserControlled = true
}

function onModelWheel(event) {
  if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) markModelRailManual()
}

function onVerticalScroll() {
  if (modelRailUserControlled || window.matchMedia('(prefers-reduced-motion: reduce)').matches || modelScrollFrame) return
  modelScrollFrame = window.requestAnimationFrame(() => {
    modelScrollFrame = 0
    const rail = modelRail.value
    if (!rail) return
    const top = rail.getBoundingClientRect().top
    const progress = Math.max(0, Math.min(1, (window.innerHeight * .86 - top) / (window.innerHeight * .85)))
    rail.scrollLeft = progress * Math.min(rail.firstElementChild?.clientWidth * .7 || 145, 165)
  })
}

onMounted(() => {
  window.addEventListener('scroll', onVerticalScroll, { passive: true })
  onVerticalScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onVerticalScroll)
  window.cancelAnimationFrame(modelScrollFrame)
  window.clearTimeout(scrollSyncTimer)
})

async function copyText(value, target) {
  try {
    await navigator.clipboard.writeText(value)
    copiedTarget.value = target
    window.setTimeout(() => {
      if (copiedTarget.value === target) copiedTarget.value = ''
    }, 1800)
  } catch {
    copiedTarget.value = ''
  }
}
</script>

<template>
  <main class="page-shell">
    <header class="media-site-header" aria-label="Media.io main navigation">
      <a class="media-site-brand" href="https://www.media.io/" aria-label="Media.io home"><img :src="mediaioLogo" alt="" /><span>media.io</span></a>
      <nav class="media-site-nav" aria-label="Media.io navigation">
        <a href="https://www.media.io/">Explore</a><a href="https://www.media.io/ai/image-to-image/">Image</a><a href="https://www.media.io/ai/video-generator/">Video</a><a href="https://www.media.io/audio/">Audio</a><a href="https://www.media.io/ai/">AI Studio</a><a href="https://www.media.io/api/">API</a><a class="nav-current" href="https://www.media.io/cli/">CLI <b>NEW</b></a>
      </nav>
      <div class="media-site-actions"><a href="https://www.media.io/pricing/">Pricing</a><a class="site-login" href="https://accounts.wondershare.com/">Log in</a><a class="site-start" href="https://www.media.io/">Get started</a></div>
    </header>
    <section class="hero-section">
      <div class="hero-noise" aria-hidden="true"></div>
      <div class="hero-dots" aria-hidden="true"></div>
      <div class="hero-glow glow-one" aria-hidden="true"></div>
      <div class="hero-glow glow-two" aria-hidden="true"></div>
      <media-io-ascii
        class="hero-ascii"
        wave-speed="2.4"
        highlight="2"
        contrast="1.5"
        wave-strength="0.2"
        aria-hidden="true"
      ></media-io-ascii>

      <div class="hero-host-wrap">
        <nav class="host-tabs" aria-label="Choose your AI agent" role="tablist">
          <button v-for="host in hosts" :key="host.id" class="host-tab" :class="{ active: activeHost.id === host.id }" type="button" role="tab" :aria-selected="activeHost.id === host.id" @click="selectHost(host)">
            <span class="host-logo" :class="`logo-${host.id}`">{{ host.icon }}</span>{{ host.label }}
          </button>
        </nav>
      </div>

      <div id="top" class="hero-copy-wrap">
        <p class="hero-kicker">MEDIA.IO PLUGIN</p>
        <h1>Build AI image &amp; video<br />workflows in <em :key="activeHost.id">{{ activeHost.label }}.</em></h1>
      </div>

      <div id="setup" class="hero-setup-wrap">
        <Transition name="setup-swap" mode="out-in">
          <div :key="activeHost.id" class="setup-panel">
            <template v-if="activeHost.mode === 'cli'">
              <div class="setup-compact-head">
                <p>Copy and send this to {{ setupTarget }}</p>
                <button class="setup-copy" type="button" @click="copyText(setupPrompt, 'setup')">{{ copiedTarget === 'setup' ? 'Copied ✓' : 'Copy' }}</button>
              </div>
              <div class="setup-prompt-preview"><pre>{{ setupPrompt }}</pre></div>
            </template>
            <template v-else-if="activeHost.mode === 'claude-connector'">
              <div class="setup-panel-top">
                <div>
                  <p class="setup-eyebrow">CLAUDE CONNECTOR</p>
                  <h2>Open Claude with Media.io prefilled.</h2>
                </div>
                <a class="setup-copy" :href="claudeUrl" target="_blank" rel="noopener noreferrer">Add to Claude ↗</a>
              </div>
              <p class="setup-hint">Review the connector details in Claude, then confirm and sign in.</p>
            </template>
            <template v-else>
              <div class="setup-panel-top">
                <div>
                  <p class="setup-eyebrow">CHATGPT · CUSTOM MCP SERVER</p>
                  <h2>Add Media.io to ChatGPT.</h2>
                </div>
                <a class="setup-copy" href="https://chatgpt.com/plugins" target="_blank" rel="noopener noreferrer">Open ChatGPT Plugins ↗</a>
              </div>
              <ol class="chatgpt-steps">
                <li>Open ChatGPT Plugins</li>
                <li>Click <strong>+</strong> in the top-right, then <strong>Add custom MCP server</strong></li>
                <li>Paste the Media.io MCP URL</li>
              </ol>
              <div class="chatgpt-url"><code>{{ connectorUrl }}</code><button type="button" @click="copyText(connectorUrl, 'connector')">{{ copiedTarget === 'connector' ? 'Copied ✓' : 'Copy URL' }}</button></div>
            </template>
          </div>
        </Transition>
      </div>
    </section>

    <section id="capabilities" class="model-section" aria-labelledby="capabilities-title">
      <div class="model-section-heading">
        <div class="model-section-copy">
          <h2 id="capabilities-title">Access <span class="model-inline"><img :src="seedanceLogo" alt="" /><strong>Seedance</strong></span>, <span class="model-inline"><img :src="gptLogo" alt="" /><strong>GPT Image</strong></span>, <span class="model-inline"><img :src="nanoLogo" alt="" /><strong>Nano Banana</strong></span>, and other leading models in your agent.</h2>
          <div class="free-pill model-free-pill"><span>Free Unlimited AI Creation — Images for All, Videos for Members</span><i></i><span class="free-badge" :style="{ backgroundImage: `url(${freeBadge})` }">NO CREDITS REQUIRED</span></div>
        </div>
      </div>
      <div ref="modelRail" class="model-rail" aria-label="Image models followed by video models" tabindex="0" @pointerdown="markModelRailManual" @keydown="markModelRailManual" @wheel.passive="onModelWheel">
        <article v-for="model in modelCards" :key="model.id" class="model-card" :data-model-id="model.id">
          <div class="model-preview">
            <img :src="model.preview" alt="" loading="lazy" />
            <span v-if="model.badge" class="model-free" :class="{ 'model-free-vip': model.badge === 'VIP FREE' }">{{ model.badge }}</span>
            <div class="model-meta"><img :src="model.logo" alt="" /><strong>{{ model.name }}</strong></div>
          </div>
        </article>
      </div>
      <p class="model-footnote">Visuals are illustrative previews. Availability and free access follow the model labels shown above.</p>
    </section>

    <section id="showcase" class="workflow-section" aria-labelledby="showcase-title">
      <div class="scenes-header"><h2 id="showcase-title">See what you can create</h2><span>Choose a workflow, copy the prompt</span></div>
      <nav class="scene-tabs" role="tablist" aria-label="Creative workflows">
        <button v-for="(scene, index) in scenes" :key="scene.id" class="scene-tab" :class="{ active: activeSceneId === scene.id }" type="button" role="tab" :aria-selected="activeSceneId === scene.id" @click="selectScene(scene)"><span>0{{ index + 1 }}</span>{{ scene.label }}</button>
      </nav>
      <div class="showcase-shell">
        <div ref="showcaseViewport" class="showcase-viewport" @scroll.passive="syncSceneFromScroll">
          <article v-for="scene in scenes" :key="scene.id" class="showcase-slide" :class="scene.className" role="tabpanel" :aria-label="scene.label">
            <div class="showcase-media">
              <img :src="scene.asset" :alt="`${scene.label} example`" />
              <span class="showcase-media-label">{{ scene.badge }}</span>
            </div>
            <div class="showcase-content">
              <h3>{{ scene.title }}</h3>
              <div class="showcase-prompt"><div><span>EXAMPLE PROMPT</span><button type="button" @click="copyText(scene.prompt, `prompt-${scene.id}`)">{{ copiedTarget === `prompt-${scene.id}` ? 'Copied ✓' : 'Copy prompt ↗' }}</button></div><p>{{ scene.prompt }}</p></div>
            </div>
          </article>
        </div>
        <div class="showcase-controls"><span>0{{ activeSceneIndex + 1 }} <i>/</i> 0{{ scenes.length }}</span><div><button type="button" aria-label="Previous workflow" :disabled="activeSceneIndex === 0" @click="moveScene(-1)">←</button><button type="button" aria-label="Next workflow" :disabled="activeSceneIndex === scenes.length - 1" @click="moveScene(1)">→</button></div></div>
      </div>
    </section>
  </main>
</template>
