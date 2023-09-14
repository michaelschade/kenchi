import { KenchiMessageRouter } from '@kenchi/commands';

import { injectStylesheet } from '../utils';

const RECORDING_BAR_ID = 'kenchi-recording-bar';

export default class Recorder {
  constructor(
    private router: KenchiMessageRouter<'contentScript'>,
    private isPaused: boolean
  ) {
    this.initUI();
  }

  private initUI() {
    injectStylesheet(`
      #${RECORDING_BAR_ID} {
        font-family: sans-serif;
        font-size: 16px;
        position: fixed;
        top: 0;
        left: calc(50% - 250px);
        width: 500px;
        background-color: #fff;
        color: #000;
        z-index: 9999;
        border-radius: 0 0 5px 5px;
        padding: 5px;
        border: 1px solid #ccc;
      }

      #${RECORDING_BAR_ID} > .kenchi-content {
        text-align: center;
      }

      #${RECORDING_BAR_ID} > .kenchi-buttons {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 10px;
      }

      #${RECORDING_BAR_ID} > .kenchi-buttons > button {
        // TODO
      }
    `);
    const div = document.createElement('div');
    div.id = RECORDING_BAR_ID;

    const content = document.createElement('div');
    content.className = 'kenchi-content';
    content.innerHTML = `Recording<br />Search for a user, click through to their user page, and click "Done".<br />Need to login? Click "Pause" to temporarily stop recording.`;
    div.appendChild(content);

    const blink = document.createElement('span');
    blink.innerText = '🔴';
    blink.style.paddingRight = '5px';
    window.setInterval(() => {
      blink.style.visibility =
        blink.style.visibility === 'visible' ? 'hidden' : 'visible';
    }, 700);
    content.prepend(blink);

    const buttons = document.createElement('div');
    buttons.className = 'kenchi-buttons';
    div.appendChild(buttons);

    const buttonDone = document.createElement('button');
    buttonDone.innerText = 'Done 🎉';
    buttons.appendChild(buttonDone);

    const buttonPause = document.createElement('button');
    buttonPause.innerText = this.isPaused ? 'Resume' : 'Pause';
    buttons.appendChild(buttonPause);

    const buttonStop = document.createElement('button');
    buttonStop.innerText = 'Cancel';
    buttons.appendChild(buttonStop);

    document.body.appendChild(div);

    buttonDone.addEventListener('click', () => this.process());

    buttonPause.addEventListener('click', async () => {
      if (this.isPaused) {
        await this.router.sendCommand('background', 'recordPause');
      } else {
        await this.router.sendCommand('background', 'recordResume');
      }
      this.isPaused = !this.isPaused;
      buttonPause.innerText = this.isPaused ? 'Resume' : 'Pause';
    });

    buttonStop.addEventListener('click', async () => {
      await this.router.sendCommand('background', 'recordCancel');
    });
  }

  private async process() {
    await this.router.sendCommand('background', 'recordDone', {});
  }
}
