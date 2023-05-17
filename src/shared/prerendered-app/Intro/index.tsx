import { h, Component } from 'preact';

import { linkRef } from 'shared/prerendered-app/util';
import '../../custom-els/loading-spinner';
import logoWithText from 'url:./imgs/logo-with-text.svg';
import * as style from './style.css';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import 'shared/custom-els/snack-bar';
import { termText } from './style.css';

const installButtonSource = 'introInstallButton-Purple';
const supportsClipboardAPI =
  !__PRERENDER__ && navigator.clipboard && navigator.clipboard.read;

async function getImageClipboardItem(
  items: ClipboardItem[],
): Promise<undefined | Blob> {
  for (const item of items) {
    const type = item.types.find((type) => type.startsWith('image/'));
    if (type) return item.getType(type);
  }
}

interface Props {
  onFile?: (file: File) => void;
  showSnack?: SnackBarElement['showSnackbar'];
}
interface State {
  fetchingDemoIndex?: number;
  beforeInstallEvent?: BeforeInstallPromptEvent;
  showBlobSVG: boolean;
}

export default class Intro extends Component<Props, State> {
  state: State = {
    showBlobSVG: true,
  };

  private fileInput?: HTMLInputElement;
  private blobCanvas?: HTMLCanvasElement;
  private installingViaButton = false;

  componentDidMount() {
    // Listen for beforeinstallprompt events, indicating Squoosh is installable.
    window.addEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPromptEvent,
    );

    // Listen for the appinstalled event, indicating Squoosh has been installed.
    window.addEventListener('appinstalled', this.onAppInstalled);
  }

  componentWillUnmount() {
    window.removeEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPromptEvent,
    );
    window.removeEventListener('appinstalled', this.onAppInstalled);
  }

  private onFileChange = (event: Event): void => {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    this.fileInput!.value = '';
    this.props.onFile!(file);
  };

  private onOpenClick = () => {
    this.fileInput!.click();
  };

  private onBeforeInstallPromptEvent = (event: BeforeInstallPromptEvent) => {
    // Don't show the mini-infobar on mobile
    event.preventDefault();

    // Save the beforeinstallprompt event so it can be called later.
    this.setState({ beforeInstallEvent: event });

    // Log the event.
    const gaEventInfo = {
      eventCategory: 'pwa-install',
      eventAction: 'promo-shown',
      nonInteraction: true,
    };
    ga('send', 'event', gaEventInfo);
  };

  private onInstallClick = async (event: Event) => {
    // Get the deferred beforeinstallprompt event
    const beforeInstallEvent = this.state.beforeInstallEvent;
    // If there's no deferred prompt, bail.
    if (!beforeInstallEvent) return;

    this.installingViaButton = true;

    // Show the browser install prompt
    beforeInstallEvent.prompt();

    // Wait for the user to accept or dismiss the install prompt
    const { outcome } = await beforeInstallEvent.userChoice;
    // Send the analytics data
    const gaEventInfo = {
      eventCategory: 'pwa-install',
      eventAction: 'promo-clicked',
      eventLabel: installButtonSource,
      eventValue: outcome === 'accepted' ? 1 : 0,
    };
    ga('send', 'event', gaEventInfo);

    // If the prompt was dismissed, we aren't going to install via the button.
    if (outcome === 'dismissed') {
      this.installingViaButton = false;
    }
  };

  private onAppInstalled = () => {
    // We don't need the install button, if it's shown
    this.setState({ beforeInstallEvent: undefined });

    // Don't log analytics if page is not visible
    if (document.hidden) return;

    // Try to get the install, if it's not set, use 'browser'
    const source = this.installingViaButton ? installButtonSource : 'browser';
    ga('send', 'event', 'pwa-install', 'installed', source);

    // Clear the install method property
    this.installingViaButton = false;
  };

  private onPasteClick = async () => {
    let clipboardItems: ClipboardItem[];

    try {
      clipboardItems = await navigator.clipboard.read();
    } catch (err) {
      this.props.showSnack!(`No permission to access clipboard`);
      return;
    }

    const blob = await getImageClipboardItem(clipboardItems);

    if (!blob) {
      this.props.showSnack!(`No image found in the clipboard`);
      return;
    }

    this.props.onFile!(new File([blob], 'image.unknown'));
  };

  render(
    {}: Props,
    { fetchingDemoIndex, beforeInstallEvent, showBlobSVG }: State,
  ) {
    return (
      <div class={style.intro}>
        <input
          class={style.hide}
          ref={linkRef(this, 'fileInput')}
          type="file"
          onChange={this.onFileChange}
        />
        <div class={style.main}>
          {!__PRERENDER__ && (
            <canvas
              ref={linkRef(this, 'blobCanvas')}
              class={style.blobCanvas}
            />
          )}
          <h1 class={style.logoContainer}>
            old_squoosh
          </h1>
          <span className={style.termText}>A fork of Squoosh that preserves CLI functionality</span>
          <div class={style.loadImg}>
            {showBlobSVG && (
              <svg
                class={style.blobSvg}
                viewBox="-1.25 -1.25 2.5 2.5"
                preserveAspectRatio="xMidYMid slice"
              >
              </svg>
            )}
            <div
              class={style.loadImgContent}
              style={{ visibility: __PRERENDER__ ? 'hidden' : '' }}
            >
              <button class={style.loadBtn} onClick={this.onOpenClick}>
                <svg viewBox="0 0 24 24" class={style.loadIcon}>
                  <path d="M19 7v3h-2V7h-3V5h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5a2 2 0 00-2 2v12c0 1.1.9 2 2 2h12a2 2 0 002-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z" />
                </svg>
              </button>
              <div>
                <span class={style.dropText}>Drop OR&nbsp;</span>
                {supportsClipboardAPI ? (
                  <button class={style.pasteBtn} onClick={this.onPasteClick}>
                    Paste
                  </button>
                ) : (
                  'Paste'
                )}
              </div>
            </div>
          </div>
          <div className={style.termText}>
            No images are ever uploaded to our servers. All image processing is
            done right in your browser.
          </div>
        </div>
        <div class={style.bottomContainer}>
        </div>
        <div class={style.footer}>
          <div class={style.contentPadding}>
            <div className={style.termText}>
              Original code by Google, who has unfortunately dropped support for
              the CLI component. This fork reintroduces the CLI component and is
              maintained by <a href="https://www.frostoven.com">Frostoven</a>.

              <br/><br/>

              We create video games and scientific tools on&nbsp;
              <a href="https://github.com/frostoven">GitHub</a>.
              If you like our work, please consider supporting us on&nbsp;
              <a href="https://www.patreon.com/frostoven">Patreon</a>&nbsp;
              or&nbsp;
              <a href="https://www.paypal.com/donate/?hosted_button_id=F9TUSZKQLQTRL">PayPal</a>.
            </div>

            <footer class={style.footerItems}>
              <a
                class={style.footerLink}
                href="https://github.com/GoogleChromeLabs/squoosh/blob/dev/README.md#privacy"
              >
                Privacy
              </a>
              <a
                class={style.footerLink}
                href="https://www.npmjs.com/package/@squoosh/cli"
              >
                Squoosh CLI
              </a>
              <a
                class={style.footerLink}
                href="https://github.com/GoogleChromeLabs/squoosh"
              >
                Github
              </a>
            </footer>
          </div>
        </div>
        {beforeInstallEvent && (
          <button class={style.installBtn} onClick={this.onInstallClick}>
            Install
          </button>
        )}
      </div>
    );
  }
}
