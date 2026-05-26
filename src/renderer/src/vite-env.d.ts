/// <reference types="vite/client" />

import type { FocusDoApi } from '../../shared/todo'

declare global {
  interface Window {
    focusDo: FocusDoApi
  }
}
