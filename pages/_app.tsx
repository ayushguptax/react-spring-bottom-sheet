import { createBrowserInspector } from '@statelyai/inspect'
import type { InferGetStaticPropsType } from 'next'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { capitalize } from '../docs/utils'
import { debugging } from '../src/utils'

import '../docs/style.css'
import '../src/style.css'

// Setup xstate debugging, but only when in dev mode.
// xstate v5 has no global devtools hook, so the inspector is parked on a global
// that `getInspector()` in src/utils.ts picks up and hands to the machine. That
// keeps @statelyai/inspect a devDependency instead of shipping in the bundle.
if (debugging) {
  const { inspect } = createBrowserInspector({ autoStart: true })
  ;(window as any).__rsbsInspect = inspect
  console.log(
    '@statelyai/inspect setup and running! A Stately inspector tab should have opened to show the nitty gritty details of the state machine.'
  )
}

export async function getStaticProps() {
  const [
    { version, description, homepage, name, meta = {} },
    { version: reactSpringVersion },
    { version: reactUseGestureVersion },
  ] = await Promise.all([
    import('../package.json'),
    import('@react-spring/web/package.json'),
    import('@use-gesture/react/package.json'),
  ])
  if (!meta['og:site_name']) {
    meta['og:site_name'] = capitalize(name)
  }

  return {
    props: {
      version,
      description,
      homepage,
      name,
      meta,
      reactSpringVersion,
      reactUseGestureVersion,
    },
  }
}

export type GetStaticProps = InferGetStaticPropsType<typeof getStaticProps>

export default function _AppPage({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width,viewport-fit=cover" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
